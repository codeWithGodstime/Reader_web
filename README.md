# Reader web

Vite + React shop for the Reader bookstore.

## Configuration

Public config is read from the environment in `src/config.ts`. Copy `.env.example` to `.env` for local development. Production injects the same variables at build time (`vite build`); a production build fails if `VITE_API_BASE_URL` is missing.

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Django origin. Local example: `http://127.0.0.1:8001`. |
| `VITE_GOOGLE_CLIENT_ID` | Google Identity Services web client ID for Continue with Google. Leave it empty to show the button disabled. Do not commit a real client ID. |

`npm run dev` serves the app at http://localhost:5173/.

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
