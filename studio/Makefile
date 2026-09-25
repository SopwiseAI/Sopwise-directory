.PHONY: dev sit prod sync lint format check test test-cov export-dev export-sit export-prod migrate migration

sync:
	uv sync

dev:
	APP_ENV=dev uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

sit:
	APP_ENV=sit uv run uvicorn app.main:app --host 127.0.0.1 --port 8000

prod:
	APP_ENV=prod uv run uvicorn app.main:app --host 127.0.0.1 --port 8000

lint:
	uv run ruff check .

format:
	uv run ruff format .

check: lint
	uv run ruff format --check .

test:
	APP_ENV=dev uv run pytest -v

test-cov:
	APP_ENV=dev uv run pytest --cov=app --cov-report=term-missing -v

export-dev:
	APP_ENV=dev uv run python -m app.exporters

export-sit:
	APP_ENV=sit uv run python -m app.exporters

export-prod:
	APP_ENV=prod uv run python -m app.exporters

migrate:
	uv run alembic upgrade head

migration:
	uv run alembic revision --autogenerate -m "$(MSG)"