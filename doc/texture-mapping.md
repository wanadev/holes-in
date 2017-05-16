---
title: Textures
menuOrder: 1
autotoc: false
---

# Textures Mapping

## Usage:

### Default Comportement
In holes-in, the UV are computed automatically. By default, it determine the longest distance on the final polygon and use it as a reference to map UVS.

Example: For an outer shape with perimetter 500, with depth 200 and a hole with a perimetter 800, the texture will be mapped from \[0;1\] to \[0;800\].

### Settings

If you want a precise UV mapping, you can set it via the options:

```javascript
options.lengthU = 200;
options.lengthV = 400;
```
Then, your texture will be mapped from \[0;1\] to \[0;200\] belong U and \[0;1\] to \[0;400\] belong V.

## Mapping and compromises

As you probably noticed it, the mapping is continuous belong the horizontal plane but not belong the vertical plane. It is impossible to get continuousity belong both direction, and we choosed this one. Next versions will give the choice.
