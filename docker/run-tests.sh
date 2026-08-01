#!/usr/bin/env bash
set -euo pipefail

# Usage: ./docker/run-tests.sh
DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$DIR"

docker build -f docker/Dockerfile -t opencodex-test .

docker run --rm opencodex-test
