"""破坏性测试的库门禁守卫。

clean_db 会 TRUNCATE 整张 xg_* 表, 而流水线默认连的是一个名字带 sit 的远端共享库。
门禁本身必须可被独立验证, 所以这里直接覆盖 _unsafe_to_truncate 的判定矩阵 ——
不能只靠"跑一遍没出事"来证明它有效。

矩阵里用的是【真正的 Settings】而不是 SimpleNamespace: 用鸭子类型拼一个假 settings
很方便, 但它会绕过字段校验, 于是"不可达的分支"也能被断言成"通过" —— 这里曾经就有
一条 app_env="test" 的用例(APP_ENV=test 会被 Settings 直接拒绝), 见下面那条约束用例。
"""

from typing import Any

import pytest
from pydantic import ValidationError

from app.core.config import Settings
from tests.conftest import _TRUNCATE_OVERRIDE_ENV, _unsafe_to_truncate, isolated_settings


def _settings(
    *,
    app_env: str = "dev",
    db_name: str = "mfbp_kazar_sit",
    db_host: str = "10.182.32.31",
    **extra: Any,
) -> Settings:
    """判定矩阵的输入。默认那组值就是流水线真实的 dev 配置(名字带 sit 的共享库)。

    构造本身走 conftest 的共享实现(它同时挡住 .env 与进程环境变量); 额外钉 app_debug=False
    是因为 app_env="prod" 那几条会被 validate_app_debug 先拦下, 那样就测不到门禁本身了。
    prod 的用例还得自己传一个非默认 api_key(validate_api_key 会拒掉默认值), 所以留了 **extra。
    """
    return isolated_settings(app_env=app_env, app_debug=False, db_name=db_name, db_host=db_host, **extra)


def test_test_suffixed_db_is_allowed_without_override():
    """专用测试库(名字含 test)无需额外开关。"""
    assert _unsafe_to_truncate(_settings(db_name="studio_test"), allow_shared=False) is None
    assert _unsafe_to_truncate(_settings(db_name="xigee_test"), allow_shared=False) is None


def test_app_env_test_is_not_a_valid_env():
    """门禁里【没有】app_env=test 这条出口 —— AppEnv 只认 dev/sit/prod。

    以前这里有一条 test_app_env_test_is_allowed_without_override, 用 SimpleNamespace
    拼出 app_env="test" 让门禁放行, 于是它一直在给一个不可能发生的分支背书。
    改成钉住约束本身: 谁想把 test 加进 AppEnv, 这条会先红, 然后必须连带处理门禁、
    .env.example、README 与 Makefile。
    """
    with pytest.raises(ValidationError):
        _settings(app_env="test")


def test_shared_sit_db_requires_explicit_override():
    """默认的 dev/SIT 组合必须【默认拒绝】, 只有显式开关才放行。"""
    reason = _unsafe_to_truncate(_settings(), allow_shared=False)
    assert reason is not None
    assert _TRUNCATE_OVERRIDE_ENV in reason
    assert _unsafe_to_truncate(_settings(), allow_shared=True) is None


def test_prod_env_is_never_allowed():
    """生产环境不接受任何豁免, 显式开关也不行。"""
    # prod 下 Settings 本身就会拒掉默认 api_key, 所以这里必须给一个非默认值,
    # 否则用例在构造那一步就挂了, 测不到门禁
    assert _unsafe_to_truncate(_settings(app_env="prod", api_key="prod-key"), allow_shared=True) is not None


def test_prod_marker_in_db_name_is_never_allowed():
    assert _unsafe_to_truncate(_settings(db_name="studio_prod"), allow_shared=True) is not None


def test_prod_marker_in_host_is_never_allowed():
    assert _unsafe_to_truncate(_settings(db_host="db-prod.internal"), allow_shared=True) is not None


def test_empty_db_name_is_not_silently_treated_as_test():
    """库名缺失时不能误判成测试库放行。

    这个输入已经【无法通过正常构造拿到】—— Settings 现在要求 db_name 非空(见
    app/core/config.py 的 validate_db_identity)。这里用 model_construct 绕过字段校验是
    刻意的: 门禁是个纯函数, 它的防线不该建立在"调用方一定校验过了"之上。
    """
    settings = Settings.model_construct(app_env="dev", db_name="", db_host="10.182.32.31")
    assert _unsafe_to_truncate(settings, allow_shared=False) is not None
