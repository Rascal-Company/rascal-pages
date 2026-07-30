---
name: qcode
description: Use when the user types "qcode" — implement the agreed plan and run the repo's quality gates (tests, lint, typecheck).
---

Implement your plan and make sure your new tests pass.
Always run `npm run test:run` to make sure you didn't break anything else.
Always run `npm run lint` to make sure linting passes.
Always run `npx tsc --noEmit` to make sure type checking passes.
