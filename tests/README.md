# QA Test Suite

This project is a static browser SPA, so the baseline QA suite avoids build tools and runs with Node's built-in test runner.

## Commands

```bash
npm run check:js
npm run check:data
npm run test:unit
npm run qa
```

## Coverage

- `scripts/check-js-syntax.mjs` checks syntax for every file under `static/js`.
- `scripts/check-data.mjs` parses every JSON file under `static/data` and validates the core tournament/shop schemas.
- `tests/unit` covers the player model, localStorage state, match simulation, ranking, social flow, and tournament gating.

## Next E2E Layer

The next useful layer is Playwright browser coverage for:

- create player -> main page
- schedule four monthly actions -> execute month
- register tournament -> play match -> ranking changes
- shop purchase -> inventory use/gift
- save -> clear state -> load slot
