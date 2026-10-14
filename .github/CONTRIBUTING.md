# Contributing to PEARSON

## Commit messages

PEARSON uses a Conventional Commits-style format:

```text
<type>(<scope>): <short description>
```

Examples:

```text
feat(bailey): publish WhatsApp readiness event
fix(database): store order items as a PostgreSQL array
docs(readme): explain the QR linking workflow
chore(deps): update KafkaJS
```

### Commit types

| Type | Use it for |
| --- | --- |
| `feat` | A new user-facing capability or workflow |
| `fix` | A bug or incorrect behavior correction |
| `docs` | Documentation-only changes |
| `refactor` | Code changes that preserve behavior |
| `test` | Adding or changing tests |
| `perf` | A performance improvement |
| `build` | Build tooling, package, or compilation changes |
| `ci` | Continuous integration or automation changes |
| `chore` | Maintenance that does not change application behavior |
| `revert` | Reverting an earlier commit |

### Scopes

Use a short scope when it makes the affected area clear. Current examples include:

- `api`
- `bailey`
- `kafka`
- `database`
- `hotel`
- `agent`
- `web`
- `infra`
- `deps`
- `readme`

A scope is optional. Use `feat: ...` when a change spans several areas.

### Writing rules

- Start the description with a verb: `add`, `fix`, `remove`, `document`, or `update`.
- Keep the first line concise, ideally under 72 characters.
- Do not end the subject with a period.
- Describe the result of the change, not the coding process.
- Keep unrelated changes in separate commits.
- Use the commit body when context, migration steps, or operational impact needs explanation.

Example with a body:

```text
fix(bailey): publish readiness only after both sessions connect

Prevent duplicate readiness events and reset the guard when either
WhatsApp session disconnects.
```

### Breaking changes

Mark a breaking change with `!` after the type or scope:

```text
feat(api)!: replace the WhatsApp pairing response
```

Explain the migration in the commit body. You may also use a footer:

```text
BREAKING CHANGE: clients must read the pairing code from `data.code`.
```

## Before committing

Run the checks relevant to your changes:

```bash
pnpm check-types
pnpm lint
pnpm build
```

For API changes, also run:

```bash
pnpm --filter api test
```

Do not commit `.env`, credentials, WhatsApp authentication files, or generated secrets.
