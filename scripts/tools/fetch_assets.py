#!/usr/bin/env python3
import os, json, sys, urllib.request, zipfile, io

# This helper can download CC0/royalty-free match-3 assets listed in manifest.json.
# It avoids copyrighted Royal Match assets.

MANIFEST_PATH = os.path.join(os.path.dirname(__file__), 'manifest.json')
ASSETS_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../assets_external'))


def ensure_dir(path):
    os.makedirs(path, exist_ok=True)


def download_zip(url: str) -> bytes:
    with urllib.request.urlopen(url) as r:
        return r.read()


def extract_zip(content: bytes, dest_dir: str):
    with zipfile.ZipFile(io.BytesIO(content)) as z:
        z.extractall(dest_dir)


def main():
    if not os.path.exists(MANIFEST_PATH):
        print('No manifest.json found at', MANIFEST_PATH)
        sys.exit(1)
    with open(MANIFEST_PATH, 'r') as f:
        manifest = json.load(f)
    ensure_dir(ASSETS_ROOT)
    for entry in manifest.get('packages', []):
        name = entry.get('name')
        url = entry.get('url')
        subdir = entry.get('subdir', name)
        if not name or not url:
            continue
        dest_dir = os.path.join(ASSETS_ROOT, subdir)
        ensure_dir(dest_dir)
        print('Downloading', name, 'from', url)
        try:
            data = download_zip(url)
            extract_zip(data, dest_dir)
            print('Extracted to', dest_dir)
        except Exception as e:
            print('Failed to download', name, e)

if __name__ == '__main__':
    main()
