# StatusFlow - Release Process

1. **Version Bump**: Update `package.json` version adhering to Semantic Versioning (SemVer).
2. **Build Verification**: Run production Docker build & integration tests.
3. **Database Migration**: Apply production migrations (`pnpm prisma migrate deploy`).
4. **Deploy Application**: Push Docker container tags to registry and update ECS/Render services.
