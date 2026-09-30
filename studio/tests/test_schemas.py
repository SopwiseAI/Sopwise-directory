"""请求/响应模型的校验规则守卫。"""

import pytest
from pydantic import ValidationError

from app.models import RelationType
from app.schemas.models import (
    CategoryCreate,
    CategoryUpdate,
    ProductCreate,
    ProductRelationCreate,
    ProductUpdate,
    TagCreate,
    TagUpdate,
)

SLUG_MODELS = [CategoryCreate, ProductCreate, TagCreate, CategoryUpdate, ProductUpdate, TagUpdate]


@pytest.mark.parametrize("model", SLUG_MODELS)
@pytest.mark.parametrize("slug", ["a", "chat-assistant", "cat-1", "zapier", "api"])
def test_slug_accepts_url_friendly_values(model, slug):
    assert model(slug=slug, name="n").slug == slug


@pytest.mark.parametrize("model", SLUG_MODELS)
@pytest.mark.parametrize("slug", ["Chat", "chat assistant", "chat_assistant", "-chat", "chat-", "中文", ""])
def test_slug_rejects_invalid_values(model, slug):
    with pytest.raises(ValidationError):
        model(slug=slug, name="n")


@pytest.mark.parametrize("pricing", ["free", "freemium", "paid", "opensource"])
def test_pricing_accepts_known_values(pricing):
    assert ProductCreate(slug="p", name="P", pricing=pricing).pricing == pricing
    assert ProductUpdate(pricing=pricing).pricing == pricing


@pytest.mark.parametrize("pricing", ["", "FREE", "trial"])
def test_pricing_rejects_unknown_values(pricing):
    with pytest.raises(ValidationError):
        ProductCreate(slug="p", name="P", pricing=pricing)
    with pytest.raises(ValidationError):
        ProductUpdate(pricing=pricing)


def test_relation_type_default_comes_from_enum():
    assert ProductRelationCreate(related_id=1).relation_type == RelationType.SIMILAR.value
