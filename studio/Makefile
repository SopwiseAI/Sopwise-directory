.PHONY: dev prod sync lint format check test export

sync:
	uv sync

dev:
	APP_ENV=dev uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

prod:
	APP_ENV=prod uv run uvicorn app.main:app --host 127.0.0.1 --port 8000

lint:
	uv run ruff check .

format:
	uv run ruff format .

check: lint
	uv run ruff format --check .

test:
	uv run pytest -v

export:
	APP_ENV=dev uv run python -m app.exporters

migrate:
	uv run alembic upgrade head

migration:
	uv run alembic revision --autogenerate -m "$(MSG)"
