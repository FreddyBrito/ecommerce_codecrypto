#!/bin/bash
# restart-all.sh — Alias for start-stablecoin.sh
# Deploys all contracts and starts all applications.

exec "$(dirname "$0")/start-stablecoin.sh" "$@"
