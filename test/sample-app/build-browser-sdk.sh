echo "Building browser-sdk"
cd ../../
yarn build
yalc publish
cd ./test/sample-app
rm -rf node_modules
yalc add @whereby.com/browser-sdk
yarn install

# Revert the version in package.json to not use a local version of the sdk
# so the git diff is clean (only when not on CI)
if [ -z "$CI" ]; then
    echo "Reverting package.json"
    sed -i '' -e 's/"@whereby.com\/browser-sdk": "file:.yalc\/@whereby.com\/browser-sdk"/"@whereby.com\/browser-sdk": "2.0.0"/g' package.json
fi
