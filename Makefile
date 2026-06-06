.DEFAULT_GOAL := help

PLUGIN_ID  := frontmatter-date-manager
PLUGIN_DIR := $(OBSIDIAN_VAULT_TEST)/.obsidian/plugins/$(PLUGIN_ID)

.PHONY: help install build dev lint format format-check test test-watch pre-commit local-test

help: ## Show available commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	npm ci

build: ## Type-check and build for production
	npm run build

dev: ## Start dev mode with watch
	npm run dev

lint: ## Run ESLint
	npm run lint

format: ## Fix formatting with Prettier
	npm run format:write

format-check: ## Check formatting with Prettier
	npm run format:check

test: ## Run all tests
	npm test

test-watch: ## Run tests in watch mode
	npm run test:watch

pre-commit: ## Run all checks (format, lint, test, build)
	@$(MAKE) format-check
	@$(MAKE) lint
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
