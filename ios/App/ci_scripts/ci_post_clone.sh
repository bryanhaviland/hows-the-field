#!/bin/sh
set -e

# Xcode Cloud clones the repo but doesn't run any package manager, so
# node_modules is empty. CapApp-SPM/Package.swift resolves Capacitor's
# iOS packages as LOCAL Swift packages living under
# node_modules/@capacitor/* and node_modules/@revenuecat/*, so SPM
# dependency resolution fails until those directories exist on disk.
#
# Beyond that, ios/App/App/capacitor.config.json, config.xml, and the
# bundled web assets under ios/App/App/public are all generated files
# (git-ignored, built locally via `npm run cap:sync`) that a fresh clone
# doesn't have either — Xcode's own "Copy Capacitor Config"/"Copy web
# assets" build phases fail without them. This script runs before Xcode
# resolves packages or runs those phases, so doing both here fixes it.

cd "$CI_WORKSPACE"

if ! command -v node >/dev/null 2>&1; then
  echo "node not found on image, installing via Homebrew"
  brew install node
fi

echo "Node: $(node -v), npm: $(npm -v)"
npm ci

# Builds the static web export (out/) and copies it + regenerates
# capacitor.config.json/config.xml into ios/App/App/.
npm run cap:sync
