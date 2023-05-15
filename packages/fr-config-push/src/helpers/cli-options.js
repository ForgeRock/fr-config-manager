const cliOptions = (requestedOptions) => {
  const options = {
    username: {
      alias: "u",
      demandOption: false,
      describe: "Tenant Admin Email",
    },
    password: {
      alias: "p",
      demandOption: false,
      describe: "Tenant Admin Password",
    },
    realm: {
      alias: "r",
      demandOption: false,
      describe: "ForgeRock Realm",
      default: "alpha",
    },
    idmUsername: {
      alias: "iu",
      demandOption: false,
      describe: "IDM Admin Username",
    },
    idmPassword: {
      alias: "ip",
      demandOption: false,
      describe: "IDM Admin Password",
    },
    adminClientId: {
      alias: "a",
      demandOption: false,
      describe: "IDM Admin Client ID",
    },
    adminClientSecret: {
      alias: "s",
      demandOption: false,
      describe: "IDM Admin Client Secret",
    },
    versionNumber: {
      alias: "v",
      demandOption: true,
      describe: "FIDC Config Version Number",
    },
    authTreePassword: {
      alias: "t",
      demandOption: false,
      describe: "Password for the Auth Tree Admin Client",
    },
    igOidcPassword: {
      alias: "i",
      demandOption: true,
      describe: "Password for the IG OIDC Client",
    },
    igAgentPassword: {
      alias: "ia",
      demandOption: true,
      describe: "Password for the IG Agent",
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
    treeServiceUserPassword: {
      alias: "tsup",
      demandOption: false,
      describe: "Password for the Tree Service User",
    },
    filenameFilter: {
      alias: "ff",
      demandOption: false,
      describe:
        "Filename Filter (combine multiples using comma, use ~ prefix on entry for wildcard match)",
    },
    regionName: {
      alias: "rn",
      demandOption: false,
      describe: "Region Name (dev, staging, live)",
    },
    decodeValue: {
      alias: "dv",
      demandOption: false,
      describe: "Decode Value (show ESV data decoded)",
      default: "false",
    },
    configDir: {
      alias: "c",
      demandOption: true,
      describe: "Path to the config directory. I.e /tmp/config",
    },
  };

  return requestedOptions.reduce(
    (acc, curr) => ({ ...acc, [curr]: options[curr] }),
    {}
  );
};

module.exports = cliOptions;
