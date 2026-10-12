"""模型层业务规则守卫。"""

from app.models import VALID_STATUS_TRANSITIONS, ProductStatus


def test_status_transitions_match_spec():
    """状态机：0→1, 1→0, 1→2, 2→3, 3→2。"""

    def names(target: ProductStatus) -> set[str]:
        return {s.name for s in VALID_STATUS_TRANSITIONS.get(target, set())}

    assert names(ProductStatus.DRAFT) == {"PENDING"}
    assert names(ProductStatus.PENDING) == {"DRAFT", "PUBLISHED"}
    assert names(ProductStatus.PUBLISHED) == {"ARCHIVED"}
    assert names(ProductStatus.ARCHIVED) == {"PUBLISHED"}
