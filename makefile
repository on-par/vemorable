check-test:
	@echo "Running tests..."
	@npm run test
	@npm run test:e2e
	@npm run lint
	@npm run type-check
	@npm run build