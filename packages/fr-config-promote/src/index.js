#!/usr/bin/env node

const yargs = require("yargs");
const cliUtils = require("./helpers/cli-options");
const { cliOptions, OPTION } = cliUtils;
const {
  checkTenantsLocked,
  lockTenants,
  unlockTenants,
  checkPromotionStatus,
  runPromotion,
  checkPromotionReports,
} = require("./scripts");

require("dotenv").config();
const authenticate = require("../../fr-config-common/src/authenticate.js");
const { all } = require("axios");

const REQUIRED_CONFIG = [
  "TENANT_ENV_UPPER_FQDN",
  "SERVICE_ACCOUNT_UPPER_CLIENT_ID",
  "SERVICE_ACCOUNT_UPPER_ID",
  "SERVICE_ACCOUNT_UPPER_KEY",
  "SERVICE_ACCOUNT_PROMOTION_SCOPE",
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

async function getCommands() {
  if (process.env.TENANT_READONLY && process.env.TENANT_READONLY === "true") {
    console.error("Environment set to readonly - no promotion permitted");
    process.exit(1);
  }

  const command = process.argv.length > 2 ? process.argv[2] : null;

  // process.env.CONFIG_DIR = process.env.CONFIG_DIR || process.cwd();

  const tenantUpperUrl = process.env.TENANT_ENV_UPPER_FQDN;
  const tenantLowerUrl = process.env.TENANT_BASE_URL;

  const lowerClientConfig = {
    clientId: process.env.SERVICE_ACCOUNT_CLIENT_ID,
    jwtIssuer: process.env.SERVICE_ACCOUNT_ID,
    privateKey: process.env.SERVICE_ACCOUNT_KEY,
    scope: process.env.SERVICE_ACCOUNT_PROMOTION_SCOPE,
  };

  const upperClientConfig = {
    clientId: process.env.SERVICE_ACCOUNT_UPPER_CLIENT_ID,
    jwtIssuer: process.env.SERVICE_ACCOUNT_UPPER_ID,
    privateKey: process.env.SERVICE_ACCOUNT_UPPER_KEY,
    scope: process.env.SERVICE_ACCOUNT_PROMOTION_SCOPE,
  };

  function getAccessToken(tenantUrl, tenantClientConfig) {
    if (!checkConfig()) {
      console.error("Configuration errors");
      process.exit(1);
    }

    return authenticate.getToken(tenantUrl, tenantClientConfig);
  }

  // Script arguments
  yargs
    .usage("Usage: $0 [arguments]")
    .strict()
    .version()
    .wrap(null)
    .alias("v", "version")
    .parserConfiguration({
      "parse-numbers": false,
      "camel-case-expansion": false,
    })
    .help("h")
    .alias("h", "help")
    .command({
      command: "check-locked-status",
      desc: "Checks tenants to see if it is locked",
      builder: cliOptions([OPTION.LOCAL_LOCK_ONLY]),
      handler: (argv) =>
        getAccessToken(tenantUpperUrl, upperClientConfig).then((token) =>
          checkTenantsLocked(argv, token)
        ),
    })
    .command({
      command: "lock-tenants",
      desc: "Lock tenants",
      builder: cliOptions([]),
      handler: (argv) =>
        getAccessToken(tenantUpperUrl, upperClientConfig).then((token) =>
          lockTenants(argv, token)
        ),
    })
    .command({
      command: "unlock-tenants",
      desc: "Unlock tenants",
      builder: cliOptions([OPTION.ID]),
      handler: (argv) =>
        getAccessToken(tenantUpperUrl, upperClientConfig).then((token) =>
          unlockTenants(argv, token)
        ),
    })
    .command({
      command: "check-promotion-status",
      desc: "Check Promotion Status",
      builder: cliOptions([]),
      handler: (argv) =>
        getAccessToken(tenantUpperUrl, upperClientConfig).then((token) =>
          checkPromotionStatus(argv, token)
        ),
    })
    .command({
      command: "run-dryrun-promotion",
      desc: "Run DryRun Promotion",
      builder: cliOptions([
        OPTION.IGNORE_ENCRYPTED_SECRETS,
        OPTION.PROMOTER,
        OPTION.PROMOTION_DESCRIPTION,
        OPTION.TICKET_REFERENCE,
        OPTION.UNLOCK_AFTER,
      ]),
      handler: (argv) =>
        getAccessToken(tenantUpperUrl, upperClientConfig).then((token) =>
          runPromotion(argv, true, token)
        ),
    })
    .command({
      command: "run-promotion",
      desc: "Run Promotion",
      builder: cliOptions([
        OPTION.IGNORE_ENCRYPTED_SECRETS,
        OPTION.PROMOTER,
        OPTION.PROMOTION_DESCRIPTION,
        OPTION.TICKET_REFERENCE,
        OPTION.UNLOCK_AFTER,
      ]),
      handler: (argv) =>
        getAccessToken(tenantUpperUrl, upperClientConfig).then((token) =>
          runPromotion(argv, false, token)
        ),
    })
    .command({
      command: "check-promotion-reports",
      desc: "Check promotion reports",
      builder: cliOptions([OPTION.LIST, OPTION.REPORTID, OPTION.PROVISIONAL]),
      handler: (argv) => {
        const provisional = argv[OPTION.PROVISIONAL];
        getAccessToken(
          provisional ? tenantLowerUrl : tenantUpperUrl,
          provisional ? lowerClientConfig : upperClientConfig
        ).then((token) => checkPromotionReports(argv, token));
      },
    })
    .option("debug", {
      alias: "d",
      type: "boolean",
      description: "Run with debug output",
    })
    .demandCommand()
    .parse();
}

getCommands();
