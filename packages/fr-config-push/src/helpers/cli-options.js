const OPTION = {
  NAME: "name",
  REALM: "realm",
  PUSH_DEPENDENCIES: "push-dependencies",
  FILENAME_FILTER: "filenameFilter",
  METADATA: "metadata",
  FORCE: "force",
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
};

const cliOptions = (requestedOptions) => {
  return requestedOptions.reduce(
    (acc, curr) => ({ ...acc, [curr]: CLI_OPTIONS[curr] }),
    {}
  );
};

module.exports.cliOptions = cliOptions;
module.exports.OPTION = OPTION;
