#!/bin/sh

rm -rf doc.generated
npm run build
./node_modules/.bin/enlightme
mkdir -p doc.generated/debug
browserify -t [babelify --presets [ es2015 ] ] -s debuglib debug/lib/index.js -o doc.generated/debug/debuglib.js
cp debug/index.html doc.generated/debug
cp debug/style.css doc.generated/debug
cp -r debug/assets doc.generated/debug
