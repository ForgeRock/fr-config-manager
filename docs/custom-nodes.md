# Custom nodes

The initial version of custom nodes does not include support for script libraries. The `custom-nodes` command assists with this limitation by optionally preprocessing node scripts to include common javascript libraries via a simple inclusion mechanism.

On push, any reference directives are subsituted with the source code from the referenced library file. E.g. given the following library file under `<config-dir>/custom-nodes/lib/num.js`

```
function addOne(input) {
  return input + 1;
}
```

This can be referenced from a custom node script `<config-dir>/custom-nodes/nodes/my-node/my-node.js` as follows

```
/// <reference path="../../lib/num.js" />

var three = addOne(2);

```

This is expanded on push so that the script in the platform config is as follows

```
/// @import-begin /// <reference path="../../lib/num.js" />
function addOne(input) {
  return input + 1;
}
/// @import-end

var three = addOne(2);
```

On pull, the expansion is reversed to preserve the original source.
