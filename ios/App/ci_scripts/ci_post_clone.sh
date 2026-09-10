#!/bin/sh
set -e

# Xcode Cloud clones the repo but doesn't run any package manager, so
# node_modules is empty. CapApp-SPM/Package.swift resolves Capacitor's
# iOS packages as LOCAL Swift packages living under
# node_modules/@capacitor/* and node_modules/@revenuecat/*, so SPM
# dependency resolution fails until those directories exist on disk.
# This script runs before Xcode resolves packages, so installing JS
# deps here fixes it.

cd "$CI_WORKSPACE"

if ! command -v node >/dev/null 2>&1; then
  echo "node not found on image, installing via Homebrew"
  brew install node
fi

echo "Node: $(node -v), npm: $(npm -v)"
npm ci
