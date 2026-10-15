from fastapi import APIRouter

from app.api.v1.endpoints import env, export, health, tool_links, tools, topics

router = APIRouter()
router.include_router(health.router, tags=["health"])
router.include_router(env.router, tags=["env"])
router.include_router(export.router, tags=["export"])
router.include_router(topics.router, prefix="/topics", tags=["topics"])
router.include_router(tools.router, prefix="/tools", tags=["tools"])
router.include_router(tool_links.router, prefix="/tools", tags=["tools"])
