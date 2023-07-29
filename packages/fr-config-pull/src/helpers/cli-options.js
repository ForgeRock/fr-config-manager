const OPTION = {
  NAME: "name",
  REALM: "realm",
  PULL_DEPENDENCIES: "pull-dependencies",
};

const cliOptions = (requestedOptions) => {
  const options = {
    realm: {
      alias: "realm",
      demandOption: false,
      describe: "ForgeRock Realm",
    },
    versionNumber: {
      alias: "version",
      demandOption: true,
      describe: "FIDC Config Version Number",
    },
    configDir: {
      alias: "configdir",
      demandOption: true,
      describe: "Path to the config directory. E.g. /tmp/config",
    },
    name: {
      alias: "name",
      demandOption: false,
      describe: "Pull specific name",
    },
  };

  return requestedOptions.reduce(
    (acc, curr) => ({ ...acc, [curr]: options[curr] }),
    {}
  );
};

module.exports.cliOptions = cliOptions;
module.exports.OPTION = OPTION;
