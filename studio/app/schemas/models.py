from datetime import datetime

from pydantic import BaseModel, Field


class CategoryBase(BaseModel):
    slug: str = Field(..., max_length=64)
    name: str = Field(..., max_length=64)
    icon: str = Field(..., max_length=64)
    description: str | None = Field(None, max_length=500)
    sort_order: int = 0
    status: int = Field(1, ge=0, le=1)


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    slug: str | None = Field(None, max_length=64)
    name: str | None = Field(None, max_length=64)
    icon: str | None = Field(None, max_length=64)
    description: str | None = Field(None, max_length=500)
    sort_order: int | None = None
    status: int | None = Field(None, ge=0, le=1)


class CategoryResponse(CategoryBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProductLinkBase(BaseModel):
    url: str = Field(..., max_length=2048, pattern="^https?://.+")
    label: str | None = Field(None, max_length=32)
    is_primary: bool = False
    status: int = Field(1, ge=1, le=3)
    sort_order: int = 0


class ProductLinkCreate(ProductLinkBase):
    pass


class ProductLinkUpdate(BaseModel):
    url: str | None = Field(None, max_length=2048, pattern="^https?://.+")
    label: str | None = Field(None, max_length=32)
    is_primary: bool | None = None
    status: int | None = Field(None, ge=1, le=3)
    sort_order: int | None = None


class ProductLinkResponse(ProductLinkBase):
    id: int
    product_id: int
    last_checked_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProductBase(BaseModel):
    slug: str = Field(..., max_length=64)
    name: str = Field(..., max_length=128)
    description: str | None = Field(None, max_length=500)
    category_ids: list[int] = Field(default_factory=list)
    pricing: str = Field("free", pattern="^(free|freemium|paid|opensource)$")
    featured: bool = False
    sort_order: int = 0
    status: int = Field(0, ge=0, le=3)


class ProductCreate(ProductBase):
    links: list[ProductLinkCreate] = Field(default_factory=list)
    tag_ids: list[int] = Field(default_factory=list)


class ProductUpdate(BaseModel):
    slug: str | None = Field(None, max_length=64)
    name: str | None = Field(None, max_length=128)
    description: str | None = Field(None, max_length=500)
    category_ids: list[int] | None = None
    pricing: str | None = Field(None, pattern="^(free|freemium|paid|opensource)$")
    featured: bool | None = None
    sort_order: int | None = None
    status: int | None = Field(None, ge=0, le=3)


class TagResponse(BaseModel):
    id: int
    slug: str
    name: str
    sort_order: int
    status: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProductResponse(BaseModel):
    id: int
    slug: str
    name: str
    description: str | None
    pricing: str
    featured: bool
    sort_order: int
    status: int
    published_at: datetime | None
    created_at: datetime
    updated_at: datetime
    categories: list[CategoryResponse] = Field(default_factory=list)
    links: list[ProductLinkResponse] = Field(default_factory=list)
    tags: list[TagResponse] = Field(default_factory=list)

    model_config = {"from_attributes": True}


TagResponse.model_rebuild()
ProductResponse.model_rebuild()


class TagBase(BaseModel):
    slug: str = Field(..., max_length=64)
    name: str = Field(..., max_length=64)
    sort_order: int = 0
    status: int = Field(1, ge=0, le=1)


class TagCreate(TagBase):
    pass


class TagUpdate(BaseModel):
    slug: str | None = Field(None, max_length=64)
    name: str | None = Field(None, max_length=64)
    sort_order: int | None = None
    status: int | None = Field(None, ge=0, le=1)


class ProductTagUpdate(BaseModel):
    tag_ids: list[int] = Field(default_factory=list)
