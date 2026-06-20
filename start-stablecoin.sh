#!/bin/bash

# ============================================================
# Script para levantar los proyectos de Stablecoin
# EuroToken SC + Compra Stablecoin + Pasarela de Pago + Web Admin
# ============================================================

set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
SC_DIR="$ROOT_DIR/stablecoin/sc"
SC_ECOMMERCE_DIR="$ROOT_DIR/sc-ecommerce"
FRONTEND_DIR="$ROOT_DIR/stablecoin/compra-stableboin"
PASARELA_DIR="$ROOT_DIR/stablecoin/pasarela-de-pago"
ADMIN_DIR="$ROOT_DIR/stablecoin/web-admin"

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
  echo -e "${GREEN}[1/5]${NC} Iniciando Anvil (blockchain local)..."
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
echo -e "${GREEN}[2/5]${NC} Compilando contratos..."
cd "$SC_DIR"
forge build --quiet
echo -e "${GREEN}[OK]${NC} EuroToken compilado"

cd "$SC_ECOMMERCE_DIR"
forge build --quiet
echo -e "${GREEN}[OK]${NC} Ecommerce compilado"

# 3. Deploy EuroToken
echo -e "${GREEN}[3/5]${NC} Desplegando EuroToken en Anvil..."

PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
forge script script/DeployEuroToken.s.sol \
  --rpc-url http://localhost:8545 \
  --broadcast 2>&1 | tee /tmp/eurotoken-deploy.log

EUROTOKEN_ADDRESS=$(grep "EuroToken deployed at:" /tmp/eurotoken-deploy.log | awk '{print $NF}')

if [ -z "$EUROTOKEN_ADDRESS" ]; then
  echo -e "${GREEN}[WARN]${NC} No se pudo extraer la direccion de EuroToken."
  echo "  Log: /tmp/eurotoken-deploy.log"
else
  echo -e "${GREEN}[OK]${NC} EuroToken desplegado en: $EUROTOKEN_ADDRESS"
fi

# 4. Deploy Ecommerce
ECOMMERCE_ADDRESS=""
if [ -n "$EUROTOKEN_ADDRESS" ]; then
  echo -e "${GREEN}[4/5]${NC} Desplegando Ecommerce en Anvil..."

  cd "$SC_ECOMMERCE_DIR"
  EUROTOKEN_ADDRESS=$EUROTOKEN_ADDRESS \
  PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  forge script script/DeployEcommerce.s.sol \
    --rpc-url http://localhost:8545 \
    --broadcast 2>&1 | tee /tmp/ecommerce-deploy.log

  ECOMMERCE_ADDRESS=$(grep "Ecommerce deployed at:" /tmp/ecommerce-deploy.log | awk '{print $NF}')

  if [ -n "$ECOMMERCE_ADDRESS" ]; then
    echo -e "${GREEN}[OK]${NC} Ecommerce desplegado en: $ECOMMERCE_ADDRESS"
  else
    echo -e "${GREEN}[WARN]${NC} No se pudo extraer la direccion de Ecommerce."
  fi
fi

# 5. Actualizar .env.local de todos los frontends
echo -e "${GREEN}[5/5]${NC} Actualizando .env.local de los frontends..."

for DIR in "$FRONTEND_DIR" "$PASARELA_DIR" "$ADMIN_DIR"; do
  ENV_FILE="$DIR/.env.local"

  if [ -f "$ENV_FILE" ]; then
    if [ -n "$EUROTOKEN_ADDRESS" ]; then
      sed -i '' "s|NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=.*|NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=$EUROTOKEN_ADDRESS|" "$ENV_FILE"
    fi
    if [ -n "$ECOMMERCE_ADDRESS" ]; then
      if grep -q "NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS" "$ENV_FILE"; then
        sed -i '' "s|NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=.*|NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=$ECOMMERCE_ADDRESS|" "$ENV_FILE"
      else
        echo "NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=$ECOMMERCE_ADDRESS" >> "$ENV_FILE"
      fi
    fi
    echo -e "${GREEN}[OK]${NC} $(basename $DIR)/.env.local actualizado"
  else
    cat > "$ENV_FILE" <<EOF
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=${EUROTOKEN_ADDRESS:-}
NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=${ECOMMERCE_ADDRESS:-}
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_RPC_URL=http://localhost:8545
EOF
    echo -e "${GREEN}[OK]${NC} $(basename $DIR)/.env.local creado"
  fi
done

# Inyectar keys de Stripe desde .env.stripe (no commiteado)
STRIPE_ENV="$ROOT_DIR/.env.stripe"
if [ -f "$STRIPE_ENV" ]; then
  ENV_FILE="$FRONTEND_DIR/.env.local"
  while IFS='=' read -r key value; do
    [[ "$key" =~ ^#.*$ || -z "$key" ]] && continue
    key=$(echo "$key" | xargs)
    value=$(echo "$value" | xargs)
    if grep -q "^${key}=" "$ENV_FILE"; then
      sed -i '' "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
    else
      echo "${key}=${value}" >> "$ENV_FILE"
    fi
  done < "$STRIPE_ENV"
  echo -e "${GREEN}[OK]${NC} Keys de Stripe inyectadas en compra-stableboin"
else
  echo -e "${GREEN}[WARN]${NC} .env.stripe no encontrado."
fi

echo ""
echo -e "${BLACK}========================================${NC}"
echo -e "${GREEN}  Proyectos listos!${NC}"
echo -e "${BLACK}========================================${NC}"
echo ""
echo "  Anvil:              http://localhost:8545"
echo "  Compra Stablecoin:  http://localhost:3000"
echo "  Pasarela de Pago:   http://localhost:6002"
echo "  Web Admin:          http://localhost:6003"
echo ""
echo "  EuroToken:          ${EUROTOKEN_ADDRESS:-revisa /tmp/eurotoken-deploy.log}"
echo "  Ecommerce:          ${ECOMMERCE_ADDRESS:-revisa /tmp/ecommerce-deploy.log}"
echo ""
echo -e "${GREEN}  Iniciando frontends...${NC}"
echo ""

# 6. Iniciar frontends en background
cd "$FRONTEND_DIR"
PORT=3000 npm run dev &
FRONTEND_PID=$!

cd "$PASARELA_DIR"
PORT=6002 npm run dev &
PASARELA_PID=$!

cd "$ADMIN_DIR"
PORT=6003 npm run dev &
ADMIN_PID=$!

echo "  Frontend PID:   $FRONTEND_PID"
echo "  Pasarela PID:   $PASARELA_PID"
echo "  Admin PID:      $ADMIN_PID"
echo ""
echo "Presiona Ctrl+C para detener todos los servicios"

# Esperar a que terminen
wait
