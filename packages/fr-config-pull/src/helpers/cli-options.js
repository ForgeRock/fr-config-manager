const {
  STDOUT_OPTION,
  STDOUT_OPTION_SHORT,
} = require("../../../fr-config-common/src/constants.js");
const {
  COMMON_OPTIONS,
} = require("../../../fr-config-common/src/cli-options.js");

const OPTION = {
  NAME: "name",
  REALM: "realm",
  PULL_DEPENDENCIES: "pull-dependencies",
  DUMP: "dump",
  ACTIVE_ONLY: "active-only",
  PATH: "path",
  PUSH_API_VERSION: "push-api-version",
  STDOUT: STDOUT_OPTION,
  CLEAN: "clean",
};

const CLI_OPTIONS = {
  name: {
    alias: "n",
    demandOption: false,
    describe: "Only for specific name",
    type: "string",
  },
  realm: {
    alias: "r",
    demandOption: false,
    describe: "Specific realm (overrides environment)",
    type: "string",
  },
  "pull-dependencies": {
    alias: "d",
    demandOption: false,
    describe: "Pull dependencies",
    type: "boolean",
  },
  dump: {
    alias: "u",
    demandOption: false,
    describe: "Dump values",
    type: "boolean",
  },
  "active-only": {
    alias: "a",
    demandOption: false,
    describe: "Active only",
    type: "boolean",
  },
  path: {
    alias: "p",
    demandOption: false,
    describe: "Configuration path",
    type: "string",
  },
  "push-api-version": {
    alias: "x",
    demandOption: false,
    describe: "Configuration push API version",
    type: "string",
  },
  stdout: {
    alias: STDOUT_OPTION_SHORT,
    demandOption: false,
    describe: "Print to stdout",
    type: "boolean",
  },
  clean: {
    alias: "c",
    demandOption: false,
    describe: "Clear existing configuration before pull",
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
