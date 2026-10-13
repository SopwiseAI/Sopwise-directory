"""破坏性测试的库门禁守卫。

clean_db 会 TRUNCATE 整张 xg_* 表, 而流水线默认连的是一个名字带 sit 的远端共享库。
门禁本身必须可被独立验证, 所以这里直接覆盖 _unsafe_to_truncate 的判定矩阵 ——
不能只靠"跑一遍没出事"来证明它有效。
"""

from types import SimpleNamespace

from tests.conftest import _TRUNCATE_OVERRIDE_ENV, _unsafe_to_truncate


def _settings(*, app_env: str = "dev", db_name: str = "mfbp_kazar_sit", db_host: str = "10.182.32.31"):
    return SimpleNamespace(app_env=app_env, db_name=db_name, db_host=db_host)


def test_shared_sit_db_requires_explicit_override():
    """默认的 dev/SIT 组合必须【默认拒绝】, 只有显式开关才放行。"""
    reason = _unsafe_to_truncate(_settings(), allow_shared=False)
    assert reason is not None
    assert _TRUNCATE_OVERRIDE_ENV in reason
    assert _unsafe_to_truncate(_settings(), allow_shared=True) is None


def test_test_suffixed_db_is_allowed_without_override():
    """专用测试库(名字含 test)无需额外开关。"""
    assert _unsafe_to_truncate(_settings(db_name="studio_test"), allow_shared=False) is None


def test_app_env_test_is_allowed_without_override():
    """app_env=test 是指定的安全出口, 无需额外开关。"""
    assert _unsafe_to_truncate(_settings(app_env="test"), allow_shared=False) is None


def test_prod_env_is_never_allowed():
    """生产环境不接受任何豁免, 显式开关也不行。"""
    assert _unsafe_to_truncate(_settings(app_env="prod"), allow_shared=True) is not None


def test_prod_marker_in_db_name_is_never_allowed():
    assert _unsafe_to_truncate(_settings(db_name="studio_prod"), allow_shared=True) is not None


def test_prod_marker_in_host_is_never_allowed():
    assert _unsafe_to_truncate(_settings(db_host="db-prod.internal"), allow_shared=True) is not None


def test_empty_db_name_is_not_silently_treated_as_test():
    """库名缺失时不能误判成测试库放行。"""
    assert _unsafe_to_truncate(_settings(db_name=""), allow_shared=False) is not None
