<!-- Testable pass/fail criteria. Each maps back to a requirement (FR-/NFR-). Written so a reviewer
     (or a test) can objectively say "met" or "not met". Prefer Given/When/Then. -->

# Acceptance criteria — {{TASK_TITLE}}

[⌂ index](index.md) · verifies [requirements.md](requirements.md)

## Scenarios

### AC-1 — <maps to FR-1>

- **Given** <initial state>
- **When** <user does X>
- **Then** <observable outcome>

### AC-2 — <maps to FR-2>

- **Given** …
- **When** …
- **Then** …

## Edge cases & error states

<!-- Empty data, boundary values, invalid input, permission denied, first run, offline/timeout,
     existing data from an older version. -->

- **AC-E1** — <given the empty/invalid/failure case> → <expected graceful behavior>.

## Non-functional checks

<!-- One line per NFR that can be observed: performance budget met, no PII in logs, accessibility check passes. -->

- **AC-N1 (from NFR-x)** — <how it's verified>.

## Verification method

<!-- For each AC: unit test / integration test / e2e / manual check / migration run on existing data.
     Follow the project's testing rules on what must be covered automatically. -->
