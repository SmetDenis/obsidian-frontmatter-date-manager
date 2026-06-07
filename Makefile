.DEFAULT_GOAL := help

PLUGIN_ID  := frontmatter-date-manager
PLUGIN_DIR := $(OBSIDIAN_VAULT_TEST)/.obsidian/plugins/$(PLUGIN_ID)

.PHONY: help install build dev lint typecheck-e2e format format-check test test-watch test-e2e test-e2e-spec pre-commit local-test

help: ## Show available commands
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	npm ci

build: ## Type-check and build for production
	npm run build

dev: ## Start dev mode with watch
	npm run dev

lint: ## Run ESLint
	npm run lint

typecheck-e2e: ## Type-check e2e specs (no Obsidian needed)
	npm run typecheck:e2e

format: ## Fix formatting with Prettier
	npm run format:write

format-check: ## Check formatting with Prettier
	npm run format:check

test: ## Run all tests
	npm test

test-watch: ## Run tests in watch mode
	npm run test:watch

test-e2e: ## Run all e2e tests (builds plugin, launches real Obsidian)
	npm run test:e2e

test-e2e-spec: ## Run one e2e spec: make test-e2e-spec SPEC=auto-stamp
	@if [ -z "$(SPEC)" ]; then \
		echo "Error: set SPEC to a spec name, e.g. make test-e2e-spec SPEC=auto-stamp"; \
		echo "Available: $$(ls e2e/specs/*.e2e.ts | sed 's|e2e/specs/||;s|\.e2e\.ts||' | tr '\n' ' ')"; \
		exit 1; \
	fi
	@$(MAKE) build
	npx wdio run e2e/wdio.conf.mts --spec e2e/specs/$(SPEC).e2e.ts

pre-commit: ## Run all checks (format, lint, typecheck-e2e, test, build)
	@$(MAKE) format-check
	@$(MAKE) lint
	@$(MAKE) typecheck-e2e
	@$(MAKE) test
	@$(MAKE) build

local-test: build ## Build and copy plugin to local Obsidian vault
	@if [ -z "$(OBSIDIAN_VAULT_TEST)" ]; then \
		echo "Error: OBSIDIAN_VAULT_TEST is not set."; \
		echo ""; \
		echo "Set OBSIDIAN_VAULT_TEST in your shell, or pass it as an argument:"; \
		echo "  make local-test OBSIDIAN_VAULT_TEST=/path/to/vault"; \
		exit 1; \
	fi
	@mkdir -p "$(PLUGIN_DIR)"
	@cp ./dist/main.js ./dist/manifest.json ./dist/styles.css "$(PLUGIN_DIR)/"
	@echo "Copied to $(PLUGIN_DIR)"
