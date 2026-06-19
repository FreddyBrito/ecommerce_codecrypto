# Reglas del Proyecto ecommerce_codecrypto

## Commit obligatorio
- Al finalizar cualquier tarea que modifique codigo, **siempre hacer commit** con mensaje descriptivo usando conventional commits.

## Seguridad: Stripe Keys
- **NUNCA** exponer `STRIPE_SECRET_KEY` o `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` en codigo fuente, commits, logs o archivos commiteados.
- Las keys de Stripe van **unicamente** en `.env.stripe` (raiz del proyecto), que esta en `.gitignore`.
- El script `start-stablecoin.sh` las inyecta automaticamente al `.env.local` del frontend.
- Si se necesita una key en un archivo, usar variables de entorno (`process.env.STRIPE_SECRET_KEY`), nunca hardcodear.

## Estructura de commits
```
<type>(<scope>): <descripcion corta>

Types: feat, fix, refactor, docs, test, chore
Scopes: stablecoin, sc, compra-stableboin, pasarela-de-pago, web-admin, web-customer
```
