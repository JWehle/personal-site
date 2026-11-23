#!/bin/bash

set -euo pipefail

HUGO_VERSION="0.170.1"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
TEMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TEMP_DIR"' EXIT

ARCHIVE="hugo_${HUGO_VERSION}_linux-amd64.tar.gz"
URL="https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/${ARCHIVE}"

cd "$SCRIPT_DIR"
curl --fail --location --silent --show-error "$URL" --output "$TEMP_DIR/$ARCHIVE"
tar -xzf "$TEMP_DIR/$ARCHIVE" -C "$TEMP_DIR" hugo
"$TEMP_DIR/hugo" --minify
