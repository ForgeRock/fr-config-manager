const OPTION = {
  ID: "id",
  PROMOTE_DEPENDENCIES: "promote-dependencies",
  LIST: "list",
  REPORTID: "reportID",
  IGNORE_ENCRYPTED_SECRETS: "ignore-encrypted-secrets",
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
  "ignore-encrypted-secrets": {
    alias: "e",
    describe: "Ignore encrypted secrets",
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
