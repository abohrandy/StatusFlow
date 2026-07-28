# StatusFlow - Testing Strategy & Guidelines

## CI/CD Automated Testing Workflow
Automated testing is integrated into `.github/workflows/ci-cd.yml`:
1. `pnpm --recursive exec tsc --noEmit` - Workspace typechecking.
2. `pnpm test` - Unit and integration testing across `baileys-engine`, `utils`, `types`, and `api`.
3. `pnpm --filter @statusflow/web build` - Web app bundle production build check.
