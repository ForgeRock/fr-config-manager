#!/usr/bin/env node
const authenticate = require("../../fr-config-common/src/authenticate.js");
const { cliOptions, OPTION } = require("./helpers/cli-options.js");
const journeys = require("./scripts/journeys");
const yargs = require("yargs");
require("dotenv").config();

const COMMAND = {
  JOURNEYS: "journeys",
  TEST: "test",
};

function matchCommand(argv, command) {
  const requestedCommand = argv._[0];
  return requestedCommand === command;
}

const REQUIRED_CONFIG = [
  "TENANT_BASE_URL",
  "SERVICE_ACCOUNT_CLIENT_ID",
  "SERVICE_ACCOUNT_ID",
  "SERVICE_ACCOUNT_KEY",
  "SERVICE_ACCOUNT_SCOPE",
  "REALMS",
];

function checkConfig() {
  var valid = true;

  for (const parameter of REQUIRED_CONFIG) {
    if (!process.env[parameter]) {
      console.error("Required config", parameter, "not found");
      valid = false;
    }
  }
  return valid;
}

async function deleteConfig(argv) {
  if (!checkConfig()) {
    console.error("Configuration errors");
    process.exit(1);
  }

  if (!process.env.ENABLE_DELETE) {
    console.error(
      "fr-config-delete is currently in beta. To enable it, set ENABLE_DELETE=true in your environment"
    );
    process.exit(2);
  }
  const tenantUrl = process.env.TENANT_BASE_URL;

  const realms = argv.realm ? [argv.realm] : JSON.parse(process.env.REALMS);
  process.env.CONFIG_DIR = process.env.CONFIG_DIR || process.cwd();
  const configDir = process.env.CONFIG_DIR;
  const scriptPrefixes = process.env.SCRIPT_PREFIXES;

  const clientConfig = {
    clientId: process.env.SERVICE_ACCOUNT_CLIENT_ID,
    jwtIssuer: process.env.SERVICE_ACCOUNT_ID,
    privateKey: process.env.SERVICE_ACCOUNT_KEY,
    scope: process.env.SERVICE_ACCOUNT_SCOPE,
  };

  const token = await authenticate.getToken(tenantUrl, clientConfig);

  if (argv._.includes(COMMAND.TEST)) {
    console.log("Authenticated successfully");
    return;
  }

  const REALM_SUB_DIR = "realms";

  const realmConfigDir = `${configDir}/${REALM_SUB_DIR}`;

  if (matchCommand(argv, COMMAND.JOURNEYS)) {
    // if (!argv[OPTION.NAME]) {
    //   console.error("Missing required option", OPTION.NAME);
    //   process.exit(1);
    // }
    if (!argv[OPTION.NAME]) {
      console.log("Deleting all journeys");
    } else {
      console.log("Deleting journey", argv[OPTION.NAME]);
    }
    await journeys.deleteJourneys(
      tenantUrl,
      realms,
      argv[OPTION.NAME],
      argv[OPTION.DELETE_INNER_JOURNEYS],
      argv[OPTION.DRY_RUN],
      argv[OPTION.DEBUG],
      token
    );
  }
}

yargs
  .usage("Usage: $0 [arguments]")
  .version()
  .help("h")
  .alias("h", "help")
  .alias("v", "version")
  .parserConfiguration({
    "parse-numbers": false,
    "camel-case-expansion": false,
  })
  .strict()
  .command(COMMAND.TEST, "Test authentication", cliOptions([]), (argv) =>
    deleteConfig(argv)
  )
  .command(
    COMMAND.JOURNEYS,
    "Delete a journey",
    cliOptions([
      OPTION.REALM,
      OPTION.NAME,
      OPTION.DELETE_INNER_JOURNEYS,
      OPTION.DRY_RUN,
      OPTION.DEBUG,
    ]),
    (argv) => deleteConfig(argv)
  )
  .demandCommand()
  .parse();
