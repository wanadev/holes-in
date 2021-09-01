#!/bin/sh

holesInRoot="$(pwd)"
mkdir /tmp/holes-in-deploy/
cd /tmp/holes-in-deploy/
git clone git@github.com:wanadev/holes-in.git
cd holes-in/
git checkout gh-pages
rm -rf ./*
cp -R $holesInRoot"/doc.generated/." .

git add -A
git commit -m $0
git push
rm -rf  /tmp/holes-in-deploy/
