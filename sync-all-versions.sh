#!/bin/bash
# RETIRED. This script used to copy files between folders using /workspace paths that do not
# exist, and it kept stale copies in step with nothing. The canonical client is the Phaser web
# game; see docs/CANONICAL_CLIENT.md. The check below verifies the rules, bundle and golden
# vectors that every client must match.
set -euo pipefail
cd "$(dirname "$0")"
echo "sync-all-versions.sh is retired. Running the canonical sync check instead."
npm run --silent check:sync
