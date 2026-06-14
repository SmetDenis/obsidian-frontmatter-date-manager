.DEFAULT_GOAL := help

PLUGIN_ID  := frontmatter-date-manager
PLUGIN_DIR := $(OBSIDIAN_VAULT_TEST)/.obsidian/plugins/$(PLUGIN_ID)

# WebdriverIO 9.x cannot open a WebDriver session on Node 26: its undici rejects
# the forbidden Content-Length/Connection headers `webdriver` sets (wdio #15265),
# so e2e must run under Node <= 22. E2E_NODE_DIR points at a Node 22 bin dir
# (defaults to Homebrew's keg-only node@22) and is prepended to PATH for the e2e
# run only - your default `node` is untouched. Override if yours lives elsewhere:
#   make test-e2e E2E_NODE_DIR=/path/to/node22/bin
E2E_NODE_DIR ?= /opt/homebrew/opt/node@22/bin

.PHONY: help install build dev lint typecheck-e2e format format-check test test-watch test-e2e test-e2e-spec screenshots pre-commit local-test

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

test-e2e: ## Run all e2e tests under Node 22 (builds plugin, launches real Obsidian)
	@PATH="$(E2E_NODE_DIR):$$PATH" node --version | grep -qE 'v(1[0-9]|2[0-2])\.' || { \
		echo "Error: e2e needs Node <= 22 (wdio #15265 breaks WebDriver session creation on Node 26)."; \
		echo "       Looked in E2E_NODE_DIR=$(E2E_NODE_DIR) and PATH; neither was Node <= 22."; \
		echo "       Fix: brew install node@22  (or: make test-e2e E2E_NODE_DIR=/path/to/node22/bin)"; \
		exit 1; }
	PATH="$(E2E_NODE_DIR):$$PATH" npm run test:e2e

test-e2e-spec: ## Run one e2e spec under Node 22: make test-e2e-spec SPEC=auto-stamp
	@if [ -z "$(SPEC)" ]; then \
		echo "Error: set SPEC to a spec name, e.g. make test-e2e-spec SPEC=auto-stamp"; \
		echo "Available: $$(ls e2e/specs/*.e2e.ts | sed 's|e2e/specs/||;s|\.e2e\.ts||' | tr '\n' ' ')"; \
		exit 1; \
	fi
	@PATH="$(E2E_NODE_DIR):$$PATH" node --version | grep -qE 'v(1[0-9]|2[0-2])\.' || { \
		echo "Error: e2e needs Node <= 22 (wdio #15265 breaks WebDriver session creation on Node 26)."; \
		echo "       Looked in E2E_NODE_DIR=$(E2E_NODE_DIR) and PATH; neither was Node <= 22."; \
		echo "       Fix: brew install node@22  (or add E2E_NODE_DIR=/path/to/node22/bin)"; \
		exit 1; }
	@$(MAKE) build
	PATH="$(E2E_NODE_DIR):$$PATH" npx wdio run e2e/wdio.conf.mts --spec e2e/specs/$(SPEC).e2e.ts

screenshots: ## Regenerate store/README screenshots at exactly 1200x800 (3:2)
	@$(MAKE) test-e2e-spec SPEC=marketing-screenshots
	@command -v sips >/dev/null 2>&1 || { \
		echo "Error: sips not found (macOS only). Shots captured at 2400x1600 (3:2);"; \
		echo "       downscale to 1200x800 yourself, e.g.: mogrify -resize 1200x800 screenshots/*.png"; \
		exit 1; }
	@for f in screenshots/*.png; do sips -z 800 1200 "$$f" >/dev/null; done
	@echo "Downscaled screenshots/*.png to 1200x800 (3:2, Obsidian store spec)"

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
