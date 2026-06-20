# E-Commerce con Blockchain y Stablecoins

Sistema completo de e-commerce que integra stablecoins EURT (ERC-20), pagos con Stripe, y smart contracts para gestion de comercio electronico.

## Arquitectura

```
ecommerce_codecrypto/
├── stablecoin/
│   ├── sc/                          # EuroToken ERC-20 (6 decimales, mint onlyOwner)
│   ├── compra-stableboin/           # Compra EURT con tarjeta via Stripe (port 3000)
│   ├── pasarela-de-pago/            # Pasarela de pagos EURT (port 6002)
│   ├── web-admin/                   # Panel admin: empresas, productos, facturas (port 6003)
│   └── web-customer/                # Tienda: catalogo, carrito, checkout (port 6004)
├── sc-ecommerce/                    # Ecommerce Solidity (5 libs, 24 tests)
├── start-stablecoin.sh              # Deploy + start full system
└── restart-all.sh                   # Alias para start-stablecoin.sh
```

## Stack

| Capa | Tecnologia |
|------|-----------|
| Smart Contracts | Solidity, Foundry, OpenZeppelin v5 |
| Frontend | Next.js 16, TypeScript, Tailwind CSS v4 |
| Blockchain Local | Anvil (chainId 31337) |
| Wallet | MetaMask |
| Pagos Fiat | Stripe |
| Tokens | EURT (ERC-20, 6 decimales) |
| Interaccion | Ethers.js v6 |

## Puertos

| Servicio | URL |
|----------|-----|
| Anvil | http://localhost:8545 |
| Compra Stablecoin | http://localhost:3000 |
| Pasarela de Pago | http://localhost:6002 |
| Web Admin | http://localhost:6003 |
| Web Customer | http://localhost:6004 |

## Requisitos Previos

- [Node.js](https://nodejs.org/) >= 18
- [Foundry](https://book.getfoundry.sh/) (forge, cast)
- [MetaMask](https://metamask.io/) extension
- [Stripe](https://stripe.com/) test keys

## Setup

### 1. Clonar e instalar dependencias

```bash
git clone <repo-url>
cd ecommerce_codecrypto

# Smart contracts
cd stablecoin/sc && forge install
cd ../../sc-ecommerce && forge install

# Frontends
cd ../stablecoin/compra-stableboin && npm install
cd ../pasarela-de-pago && npm install
cd ../web-admin && npm install
cd ../web-customer && npm install
cd ../..
```

### 2. Configurar Stripe keys

Crear `.env.stripe` en la raiz del proyecto (gitignored):

```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Iniciar todo el sistema

```bash
./start-stablecoin.sh
```

El script automaticamente:
1. Detiene procesos anteriores
2. Inicia Anvil (blockchain local)
3. Deploy EuroToken y Ecommerce
4. Inyecta addresses en `.env.local` de cada frontend
5. Inicia las 4 aplicaciones

### 4. Configurar MetaMask

1. Agregar red custom: RPC `http://localhost:8545`, ChainId `31337`
2. Importar cuenta de Anvil (para admin y empresa)
3. Agregar token EURT: el address se muestra al iniciar el sistema

## Flujo del Sistema

### Comprar EURT (Stablecoin)
1. Ir a `localhost:3000`
2. Conectar MetaMask
3. Comprar EURT con tarjeta de prueba Stripe

### Registrar Empresa (Admin)
1. Ir a `localhost:6003`
2. Conectar MetaMask con cuenta de empresa
3. Registrar empresa (NIF/CIF)
4. Agregar productos con precio y stock

### Comprar Productos (Customer)
1. Ir a `localhost:6004`
2. Conectar MetaMask
3. Explorar catalogo, agregar al carrito
4. Checkout → crea invoice en blockchain
5. Redirige a pasarela de pago
6. Confirmar pago con EURT en MetaMask

### Verificar
- Admin: facturas en `localhost:6003`
- Customer: historial en `localhost:6004`

## Smart Contracts

### EuroToken (`stablecoin/sc/`)
- ERC-20 con 6 decimales (como EURT real)
- Solo el owner puede hacer mint
- Eventos `Transfer` estandar

### Ecommerce (`sc-ecommerce/`)
- 5 librerias modulares: CompanyLib, ProductLib, CartLib, InvoiceLib, PaymentLib
- IDs basados en 1 (evita colision con 0)
- Fee del 5% sobre ventas
- Carrito on-chain por direccion
- Facturas con tracking de pagos

### Tests
```bash
# EuroToken: 15 tests
cd stablecoin/sc && forge test -vv

# Ecommerce: 24 tests
cd sc-ecommerce && forge test -vv
```

## Variables de Entorno

Las addresses de los contratos se inyectan automaticamente al `.env.local` de cada frontend via `start-stablecoin.sh`. No es necesario configurarlas manualmente.

## Decisiones Tecnicas

- **EURT 6 decimales**: consistencia con stablecoins reales (EURT, USDC)
- **Direct transfer en Pasarela**: usa `transfer()` en vez de approve+transferFrom
- **Webhook Stripe**: minting de EURT se hace via webhook por seguridad
- **Cart on-chain**: carrito vive en el contrato Ecommerce, no en localStorage
- **wallet_watchAsset**: agrega EURT automaticamente a MetaMask tras conectar
- **JsonRpcProvider reads / JsonRpcSigner writes**: separacion limpia de responsabilidades

## Licencia

Proyecto educativo - CodeCrypto
