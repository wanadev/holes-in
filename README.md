![]("doc/images/text-logo.png")


[![Build Status](https://travis-ci.org/wanadev/holes-in.svg?branch=master)](https://travis-ci.org/wanadev/holes-in)
[![NPM Version](http://img.shields.io/npm/v/holes-in.svg?style=flat)](https://www.npmjs.com/package/holes-in)
[![License](http://img.shields.io/npm/l/holes-in.svg?style=flat)](https://github.com/wanadev/holes-in/blob/master/LICENSE)
[![Dependencies](https://img.shields.io/david/wanadev/holes-in.svg?maxAge=2592000)]()
[![Dev Dependencies](https://img.shields.io/david/dev/wanadev/holes-in.svg?maxAge=2592000)]()
[![Greenkeeper badge](https://badges.greenkeeper.io/wanadev/holes-in.svg)](https://greenkeeper.io/)


> A javascript library to generate 3D mesh from a 2D outer path and 2D inner paths.

## Getting started

```
npm install
npm run watchifyDebug
python3 -m http.server 3001 .
# Open http://localhost:3001/debug/debugpage/debugPage.html
```

## Documentation

[Please visit the Documentation page](https://wanadev.github.io/holes-in/)

[Or have a look to the DEMO](https://wanadev.github.io/holes-in/debug/index.html)


## Changelog
* **0.5.1:** New doc, new logo, new style :)
* **0.5.0:** Simplified getDataByDepth and handle holes into holes.
* **0.4.0:** Added option mergeVerticalGeometries to be able to separate vertical geometries in an array of meshes
* **0.3.4:** Added option doNotBuild for a thinner control of the final mesh
* **0.3.2:** Simplified pre processing for more robustness
* **0.2.5:** Removed `for ...of` for ES5 transpilation
* **0.2.3:** Added full gestion of paths that modifies the outer geometry
* **0.1.5:** Added gestion of paths that modifies the outer geometry
* **0.1.1:** Added Uvs generation
* **0.0.0:** Initial release
