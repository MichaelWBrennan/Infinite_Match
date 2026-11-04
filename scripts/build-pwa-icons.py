#!/usr/bin/env python3
"""Compatibility wrapper. PWA icons are now exported with the canonical art set.

Run `npm run art:build` (or `node scripts/build-art.mjs`) to regenerate every
runtime texture, UI icon, and PWA icon from public/js/art-direction.js.
"""
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent
sys.exit(subprocess.call(["node", "scripts/build-art.mjs"], cwd=ROOT))
