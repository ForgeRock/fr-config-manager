const {
  STDOUT_OPTION,
  STDOUT_OPTION_SHORT,
} = require("../../../fr-config-common/src/constants.js");

const OPTION = {
  NAME: "name",
  REALM: "realm",
  DELETE_INNER_JOURNEYS: "delete-inner-journeys",
  //DEBUG: "debug",
  //DRY_RUN: "dry-run",
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
  "delete-inner-journeys": {
    demandOption: false,
    describe: "Delete inner journeys",
    type: "boolean",
  }
};

const cliOptions = (requestedOptions) => {
  return requestedOptions.reduce(
    (acc, curr) => ({ ...acc, [curr]: CLI_OPTIONS[curr] }),
    {}
  );
};

module.exports.cliOptions = cliOptions;
module.exports.OPTION = OPTION;
