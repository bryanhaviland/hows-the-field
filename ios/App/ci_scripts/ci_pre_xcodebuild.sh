#!/bin/sh
set -e

# Xcode Cloud fails "Prepare Build for App Store Connect" whenever
# CURRENT_PROJECT_VERSION (the CFBundleVersion build number) in the repo
# hasn't been bumped since the last build that was uploaded to App Store
# Connect. Rather than remembering to bump it by hand before every push,
# stamp the project with Xcode Cloud's own auto-incrementing build
# number ($CI_BUILD_NUMBER), which is guaranteed to be higher than any
# previous build. See:
# https://developer.apple.com/documentation/xcode/setting-the-next-build-number-for-xcode-cloud-builds

echo "Setting CURRENT_PROJECT_VERSION to Xcode Cloud build number: $CI_BUILD_NUMBER"
cd "$CI_PRIMARY_REPOSITORY_PATH/ios/App"
sed -i '' "s/CURRENT_PROJECT_VERSION = [0-9]*;/CURRENT_PROJECT_VERSION = $CI_BUILD_NUMBER;/g" App.xcodeproj/project.pbxproj
