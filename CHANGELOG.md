# bedrock-service-context-store ChangeLog

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
