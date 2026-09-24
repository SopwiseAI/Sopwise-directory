from fastapi import APIRouter

from app.api.v1.endpoints import categories, env, export, health, products, tags

router = APIRouter()
router.include_router(health.router, tags=["health"])
router.include_router(env.router, tags=["env"])
router.include_router(export.router, tags=["export"])
router.include_router(categories.router, prefix="/categories", tags=["categories"])
router.include_router(products.router, prefix="/products", tags=["products"])
router.include_router(tags.router, prefix="/tags", tags=["tags"])
