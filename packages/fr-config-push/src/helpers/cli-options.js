const OPTION = {
  NAME: "name",
  REALM: "realm",
  PUSH_DEPENDENCIES: "push-dependencies",
  FILENAME_FILTER: "filenameFilter",
};

const cliOptions = (requestedOptions) => {
  const options = {
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
    filenameFilter: {
      alias: "ff",
      demandOption: false,
      describe:
        "Filename Filter (combine multiples using comma, use ~ prefix on entry for wildcard match)",
    },
  };

  return requestedOptions.reduce(
    (acc, curr) => ({ ...acc, [curr]: options[curr] }),
    {}
  );
};

module.exports.cliOptions = cliOptions;
module.exports.OPTION = OPTION;
