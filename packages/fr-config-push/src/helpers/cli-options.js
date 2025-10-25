const {
  STDIN_OPTION,
  STDIN_OPTION_SHORT,
} = require("../../../fr-config-common/src/constants.js");

const OPTION = {
  NAME: "name",
  REALM: "realm",
  PUSH_DEPENDENCIES: "push-dependencies",
  FILENAME_FILTER: "filenameFilter",
  METADATA: "metadata",
  FORCE: "force",
  CHECK: "check",
  WAIT: "wait",
  STATUS: "status",
  PATH: "path",
  PRUNE: "prune",
  STDIN: STDIN_OPTION,
  DRAFT: "draft",
};

const CLI_OPTIONS = {
  realm: {
    alias: "r",
    demandOption: false,
    describe: "ForgeRock Realm",
  },
  name: {
    alias: "n",
    demandOption: false,
    describe: "Push specific name",
  },
  metadata: {
    alias: "m",
    demandOption: false,
    describe: "Configuration metadata",
  },
  filenameFilter: {
    alias: "ff",
    demandOption: false,
    describe:
      "Filename Filter (combine multiples using comma, use ~ prefix on entry for wildcard match)",
  },
  "push-dependencies": {
    alias: "d",
    describe: "Push dependencies",
    type: "boolean",
  },
  force: {
    alias: "f",
    describe: "Force",
    type: "boolean",
  },
  check: {
    alias: "c",
    describe: "Check first if ESVs changed",
    type: "boolean",
  },
  wait: {
    alias: "w",
    describe: "Wait",
    type: "boolean",
  },
  status: {
    alias: "s",
    describe: "Status",
    type: "boolean",
  },
  path: {
    alias: "p",
    demandOption: false,
    describe: "Push specific configuration",
    type: "string",
  },
  prune: {
    alias: "x",
    demandOption: false,
    describe: "Prune old configuration",
    type: "boolean",
  },
  stdin: {
    alias: STDIN_OPTION_SHORT,
    describe: "Read config from stdin",
    type: "boolean",
  },
  draft: {
    alias: "r",
    describe: "Draft version",
    type: "boolean",
  },
};

const cliOptions = (requestedOptions) => {
  return requestedOptions.reduce(
    (acc, curr) => ({ ...acc, [curr]: CLI_OPTIONS[curr] }),
    {}
  );
};

module.exports.cliOptions = cliOptions;
module.exports.OPTION = OPTION;
