# React + Vite

## License configuration

The local-first Questionnaire Pass is identified from the Lemon Squeezy
`variant_id`. After creating the real Questionnaire Pass variant, set its
numeric ID in both local development and the production Vercel project:

```dotenv
VITE_QUESTIONNAIRE_PASS_VARIANT_ID=<Questionnaire Pass variant ID>
VITE_PASSPORT_VARIANT_ID=<full ESG Passport variant ID>
```

Both tiers are matched on the numeric Lemon Squeezy `variant_id`, which is
immutable. The `variant_id` is NOT the UUID in the `checkout/buy/<uuid>` link —
read it from the variant in the dashboard, or from `GET /v1/variants`.

Matching order in `tierFromResponse`: Questionnaire Pass variant, then Passport
variant, then a name-based fallback (`KNOWN_PASSPORT_PRODUCT_NAMES`) that exists
only for historical products whose variant IDs we no longer have. Keeping the
Passport on an ID means renaming the product in Lemon Squeezy can no longer
silently block new buyers.

Copy `.env.example` to `.env.local` for local development. Do not invent a
placeholder ID or commit `.env.local`. Because these are Vite variables they are
inlined at BUILD time — rebuild and redeploy after changing either one, and do
not reuse a cached build.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
