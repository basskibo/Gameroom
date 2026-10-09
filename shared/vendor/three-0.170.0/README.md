# three.js r170 (vendored)

Copied from npm `three@0.170.0` — only the files the games use. Shared by every game, so the browser caches it once.
Games load it through an importmap:

```html
<script type="importmap">{ "imports": { "three": "../../shared/vendor/three-0.170.0/build/three.module.min.js", "three/addons/": "../../shared/vendor/three-0.170.0/examples/jsm/" } }</script>
```

To add an addon: copy it from the same npm version, keeping its path under `examples/jsm/`.
