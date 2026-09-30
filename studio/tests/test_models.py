"""模型层业务规则守卫。"""

import pytest
from pydantic import ValidationError

from app.models import VALID_STATUS_TRANSITIONS, ProductStatus, RelationType
from app.schemas.models import ProductRelationCreate, ProductRelationUpdate


def test_relation_type_enum_matches_schema_validation():
    """RelationType 是 relation_type 合法值的唯一事实源，Pydantic 校验需与之同步。"""
    allowed = {t.value for t in RelationType}
    for value in allowed:
        assert ProductRelationCreate(related_id=1, relation_type=value).relation_type == value
        assert ProductRelationUpdate(relation_type=value).relation_type == value

    with pytest.raises(ValidationError):
        ProductRelationCreate(related_id=1, relation_type="bogus")
    with pytest.raises(ValidationError):
        ProductRelationUpdate(relation_type="bogus")


def test_status_transitions_match_spec():
    """状态机：0→1, 1→0, 1→2, 2→3, 3→2。"""

    def names(target: ProductStatus) -> set[str]:
        return {s.name for s in VALID_STATUS_TRANSITIONS.get(target, set())}

    assert names(ProductStatus.DRAFT) == {"PENDING"}
    assert names(ProductStatus.PENDING) == {"DRAFT", "PUBLISHED"}
    assert names(ProductStatus.PUBLISHED) == {"ARCHIVED"}
    assert names(ProductStatus.ARCHIVED) == {"PUBLISHED"}
