const cliOptions = (requestedOptions) => {
  const options = {
    realm: {
      alias: "r",
      demandOption: false,
      describe: "ForgeRock Realm",
    },
    versionNumber: {
      alias: "v",
      demandOption: true,
      describe: "FIDC Config Version Number",
    },
    authTreeName: {
      alias: "atn",
      demandOption: false,
      describe: "Auth Tree Name",
    },
    managedUsername: {
      alias: "mu",
      demandOption: false,
      describe: "Managed Username",
    },
    filenameFilter: {
      alias: "ff",
      demandOption: false,
      describe:
        "Filename Filter (combine multiples using comma, use ~ prefix on entry for wildcard match)",
    },
    configDir: {
      alias: "c",
      demandOption: true,
      describe: "Path to the config directory. E.g. /tmp/config",
    },
  };

  return requestedOptions.reduce(
    (acc, curr) => ({ ...acc, [curr]: options[curr] }),
    {}
  );
};

module.exports = cliOptions;
