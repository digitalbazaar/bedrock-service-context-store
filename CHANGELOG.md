# bedrock-service-context-store ChangeLog

## 8.1.0 - 2022-07-xx

### Added
- Enable support for OAuth2-based authz.

## 8.0.0 - 2022-06-30

### Changed
- **BREAKING**: Require Node.js >=16.
- Test on Node.js 18.x.
- Use `package.json` `files` field.
- Lint module.
- Update dependencies.
- **BREAKING**: Update peer dependencies:
  - `@bedrock/service-agent@6`
  - `@bedrock/service-core@6`

## 7.0.2 - 2022-05-18

### Fixed
- Check `meta.type` on records to migrate not `content.type`.

## 7.0.1 - 2022-05-18

### Fixed
- Run migration on `bedrock-server.readinessCheck` to prevent it from being
  terminated in deployments.

## 7.0.0 - 2022-05-17

### Changed
- **BREAKING**: Add `migration.migrateContexts` config that defaults to `true`
  and will cause all contexts associated with a service agent created prior
  to a target migration date of May 24th (2022) to have old EDV context
  documents updated to the new EDV blind attribute format.

## 6.0.0 - 2022-05-05

### Changed
- **BREAKING**: Use `@bedrock/service-agent@5` with new EDV client using a
  new blind attribute version. This version is incompatible with previous
  versions and a manual migration must be performed to update all
  EDV documents to use the new blind attribute version -- or a new
  deployment is required.

## 5.0.0 - 2022-04-29

### Changed
- **BREAKING**: Update peer deps:
  - `@bedrock/core@6`
  - `@bedrock/express@8`
  - `@bedrock/service-agent@4`
  - `@bedrock/service-core@4`
  - `@bedrock/validation@7`.

## 4.0.0 - 2022-04-05

### Changed
- **BREAKING**: Rename package to `@bedrock/service-context-store`.
- **BREAKING**: Convert to module (ESM).
- **BREAKING**: Remove default export.
- **BREAKING**: Require node 14.x.

## 3.1.0 - 2022-03-14

### Added
- Add missing dependency `cors@2.8.5`.
- Add missing dependencies `@digitalbazaar/ed25519-signature-2020@3.0` and
  `@digitalbazaar/http-client@2.0.1` in test.

## 3.0.0 - 2022-03-11

### Changed
- **BREAKING**: Require `bedrock-service-core@3` peer dependency.

## 2.0.0 - 2022-03-01

### Changed
- **BREAKING**: Require `bedrock-service-core@2` and `bedrock-service-agent@2`
  peer dependencies.

## 1.0.0 - 2022-02-20

- See git history for changes.
