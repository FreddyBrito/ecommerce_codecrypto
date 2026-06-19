#!/bin/bash

# ============================================================
# Script para levantar los proyectos de Stablecoin
# EuroToken SC + Compra Stablecoin Frontend
# ============================================================

set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
SC_DIR="$ROOT_DIR/stablecoin/sc"
FRONTEND_DIR="$ROOT_DIR/stablecoin/compra-stableboin"

# Colores
GREEN='\033[0;32m'
BLACK='\033[0;30m'
NC='\033[0m'

echo -e "${BLACK}========================================${NC}"
echo -e "${GREEN}  EuroToken - Levantando proyectos${NC}"
echo -e "${BLACK}========================================${NC}"

# 1. Verificar que Anvil ya esta corriendo
if curl -s http://localhost:8545 > /dev/null 2>&1; then
  echo -e "${GREEN}[OK]${NC} Anvil ya esta corriendo en :8545"
else
  echo -e "${GREEN}[1/4]${NC} Iniciando Anvil (blockchain local)..."
  anvil --silent &
  ANVIL_PID=$!
  sleep 2

  if curl -s http://localhost:8545 > /dev/null 2>&1; then
    echo -e "${GREEN}[OK]${NC} Anvil corriendo (PID: $ANVIL_PID)"
  else
    echo -e "${GREEN}[ERROR]${NC} No se pudo iniciar Anvil. Instala con: curl -L https://foundry.paradigm.xyz | bash"
    exit 1
  fi
fi

# 2. Compilar contratos
echo -e "${GREEN}[2/4]${NC} Compilando contratos..."
cd "$SC_DIR"
forge build --quiet
echo -e "${GREEN}[OK]${NC} Contratos compilados"

# 3. Deploy EuroToken
echo -e "${GREEN}[3/4]${NC} Desplegando EuroToken en Anvil..."

PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
forge script script/DeployEuroToken.s.sol \
  --rpc-url http://localhost:8545 \
  --broadcast 2>&1 | tee /tmp/eurotoken-deploy.log

# Extraer direccion del contrato
CONTRACT_ADDRESS=$(grep "EuroToken deployed at:" /tmp/eurotoken-deploy.log | awk '{print $NF}')

if [ -z "$CONTRACT_ADDRESS" ]; then
  echo -e "${GREEN}[WARN]${NC} No se pudo extraer la direccion. Revisa el log manualmente."
  echo "  Log: /tmp/eurotoken-deploy.log"
else
  echo -e "${GREEN}[OK]${NC} EuroToken desplegado en: $CONTRACT_ADDRESS"

  # 4. Actualizar .env.local del frontend
  echo -e "${GREEN}[4/4]${NC} Actualizando .env.local del frontend..."
  ENV_FILE="$FRONTEND_DIR/.env.local"

  if [ -f "$ENV_FILE" ]; then
    sed -i '' "s|NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=.*|NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=$CONTRACT_ADDRESS|" "$ENV_FILE"
    echo -e "${GREEN}[OK]${NC} .env.local actualizado con direccion del contrato"
  else
    cat > "$ENV_FILE" <<EOF
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_placeholder
STRIPE_SECRET_KEY=sk_test_placeholder
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=$CONTRACT_ADDRESS
WALLET_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_RPC_URL=http://localhost:8545
EOF
    echo -e "${GREEN}[OK]${NC} .env.local creado"
  fi

  # Inyectar keys de Stripe desde .env.stripe (no commiteado)
  STRIPE_ENV="$ROOT_DIR/.env.stripe"
  if [ -f "$STRIPE_ENV" ]; then
    source "$STRIPE_ENV"
    sed -i '' "s|NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=.*|NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY|" "$ENV_FILE"
    sed -i '' "s|STRIPE_SECRET_KEY=.*|STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY|" "$ENV_FILE"
    echo -e "${GREEN}[OK]${NC} Keys de Stripe inyectadas desde .env.stripe"
  else
    echo -e "${GREEN}[WARN]${NC} .env.stripe no encontrado. Crea el archivo en la raiz del proyecto con tus keys de Stripe."
  fi
fi

echo ""
echo -e "${BLACK}========================================${NC}"
echo -e "${GREEN}  Proyectos listos!${NC}"
echo -e "${BLACK}========================================${NC}"
echo ""
echo "  Anvil:          http://localhost:8545"
echo "  Frontend:       http://localhost:3000"
echo ""
echo "  Contrato:       ${CONTRACT_ADDRESS:-revisa /tmp/eurotoken-deploy.log}"
echo ""
echo -e "${GREEN}  Iniciando frontend...${NC}"
echo ""

# 5. Iniciar frontend
cd "$FRONTEND_DIR"
npm run dev
