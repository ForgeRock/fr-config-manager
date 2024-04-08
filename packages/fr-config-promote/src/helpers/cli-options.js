const OPTION = {

  ID: "id",
  PROMOTE_DEPENDENCIES: "promote-dependencies",
  LIST: "list",
  REPORTID: "reportID",
};

const CLI_OPTIONS = {
  id: {
    alias: "i",
    describe: "ID",
    type: "string", 
    demandOption: true,
  },
  list: {
    alias: "l",
    describe: "list",
    type: "boolean",

  },
  reportID: {
    alias: "r",
    describe: "Report ID",
    type: "string", 
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
