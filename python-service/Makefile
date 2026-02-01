.PHONY: install dev test lint clean

install:
	pip install -e ".[dev]"

dev:
	uvicorn main:app --reload --port 8000

test:
	python -m pytest tests/ -v

lint:
	ruff check .
	ruff format --check .

format:
	ruff format .

clean:
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
