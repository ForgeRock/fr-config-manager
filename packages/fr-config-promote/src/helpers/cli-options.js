const OPTION = {
  NAME: "name",
  REALM: "realm",
  ID: "id",
  PROMOTE_DEPENDENCIES: "promote-dependencies",
  METADATA: "metadata",
  DRYRUN: "dryrun",
  LIST: "list",
};

const CLI_OPTIONS = {
  id: {
    alias: "i",
    describe: "ID",
    type: "string",
    
  },
  dryrun: {
    alias: "d",
    describe: "DryRun",
    type: "boolean",

  },
  list: {
    alias: "l",
    describe: "list",
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
