const OPTION = {
  NAME: "name",
  REALM: "realm",
  PULL_DEPENDENCIES: "pull-dependencies",
  DUMP: "dump",
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
};

const cliOptions = (requestedOptions) => {
  return requestedOptions.reduce(
    (acc, curr) => ({ ...acc, [curr]: CLI_OPTIONS[curr] }),
    {}
  );
};

module.exports.cliOptions = cliOptions;
module.exports.OPTION = OPTION;
