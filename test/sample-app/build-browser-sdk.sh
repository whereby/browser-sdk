echo "Building browser sdk"
cd ../../
yarn build
yalc publish 
cd ./test/sample-app
rm -rf node_modules/@whereby.com
yalc add @whereby.com/browser-sdk
