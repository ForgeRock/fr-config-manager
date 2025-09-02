# Custom nodes

The initial version of custom nodes does not include support for script libraries. The `custom-nodes` command assists with this limitation by optionally preprocessing node scripts as follows

`fr-config-push custom-nodes --expand-require`

On push, any lines in the format `var xxxx = require("llll").xxxx` will be subsituted with the source code from the referenced library file, which may be either a function or a variable declaration. The library file must be placed in the `/custom-nodes/lib` directory.

Note that this only applies to `var` declarations - not `const`. This avoids any ambiguity in scope.

`fr-config-pull custom-nodes --contract-require`

On pull, the expansion is reversed to preserve the original source.

For example, given the following library file `/custom-nodes/lib/numbers.js` (`module.exports` not required but included for future compatibility)

```
var LUCKY_NUMBER = 8;

function addOne(input) {
  return input + 1;
}

module.exports.LUCKY_NUMBER = LUCKY_NUMBER;
module.exports.addOne = addOne;
```

and the following node script

```
var LUCKY_NUMBER = require("numbers").LUCKY_NUMBER;
var addOne = require("numbers").addOne;

logger.debug(`${LUCKY_NUMBER} + 1 = ${addOne(LUCKY_NUMBER)}`);
action.goTo("next");
```

The script will be expanded to the following on push

```
// --EXPAND-FROM
// var LUCKY_NUMBER = require("numbers").LUCKY_NUMBER;
// --EXPAND-TO
var LUCKY_NUMBER = 8;
// --EXPAND-END
// --EXPAND-FROM
// var addOne = require("numbers").addOne;
// --EXPAND-TO
var addOne = function(input) {
  return input + 1;
};
// --EXPAND-END

logger.debug(`${LUCKY_NUMBER} + 1 = ${addOne(LUCKY_NUMBER)}`);
action.goTo("next");
```

Note that the substituted code is tagged with structured comments, which should not be altered in place; otherwise, the `--contract-require` logic will not apply.
