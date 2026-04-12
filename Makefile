.DEFAULT_GOAL := help

-include .env

PLUGIN_ID  := frontmatter-date-manager
PLUGIN_DIR := $(OBSIDIAN_VAULT)/.obsidian/plugins/$(PLUGIN_ID)

.PHONY: help install build dev lint format format-check test test-watch pre-commit local-test

help: ## Show available commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	yarn install --frozen-lockfile

build: ## Type-check and build for production
	yarn build

dev: ## Start dev mode with watch
	yarn dev

lint: ## Run ESLint
	yarn lint

format: ## Fix formatting with Prettier
	yarn format:write

format-check: ## Check formatting with Prettier
	yarn format:check

test: ## Run all tests
	yarn test

test-watch: ## Run tests in watch mode
	yarn test:watch

pre-commit: ## Run all checks (format, lint, test, build)
	@$(MAKE) format-check
	@$(MAKE) lint
	@$(MAKE) test
	@$(MAKE) build

local-test: build ## Build and copy plugin to local Obsidian vault
	@if [ -z "$(OBSIDIAN_VAULT)" ]; then \
		echo "Error: OBSIDIAN_VAULT is not set."; \
		echo ""; \
		echo "Set it in .env file:"; \
		echo "  echo 'OBSIDIAN_VAULT=/path/to/vault' > .env"; \
		echo ""; \
		echo "Or pass as argument:"; \
		echo "  make local-test OBSIDIAN_VAULT=/path/to/vault"; \
		exit 1; \
	fi
	@mkdir -p "$(PLUGIN_DIR)"
	@cp ./dist/main.js ./dist/manifest.json ./dist/styles.css "$(PLUGIN_DIR)/"
	@echo "Copied to $(PLUGIN_DIR)"
