#!/usr/bin/env node
const yargs = require("yargs");
const cliUtils = require("./helpers/cli-options");
const { cliOptions, OPTION } = cliUtils;
const {
  updateAgents,
  updateAuthTrees,
  updateConnectorDefinitions,
  updateConnectorMappings,
  updateCors,
  updateInternalRoles,
  updateManagedObjects,
  updateRemoteServers,
  updateScripts,
  updateServices,
  updateTermsAndConditions,
  updatePasswordPolicy,
  updateUiConfig,
  updateIdmEndpoints,
  updateIdmSchedules,
  updateIdmAccessConfig,
  updateVariables,
  updateSecrets,
  restartFidc,
  updateEmailTemplates,
  updateThemes,
  updateRealmConfig,
  updateKba,
  updateSecretMappings,
  updateAuthzPolicies,
  updateEmailProvider,
  updateServiceObjects,
  updateLocales,
  updateAudit,
  updateConfigMetadata,
  updateCsp,
  updateOrgPrivileges,
} = require("./scripts");

require("dotenv").config();
const authenticate = require("../../fr-config-common/src/authenticate.js");
const { all } = require("axios");

async function updateStatic(argv, token) {
  await updateScripts(argv, token);
  await updateAuthTrees(argv, token);
  await updateServices(argv, token);
  await updateRealmConfig(argv, "authentication", token);
  await updateManagedObjects(argv, token);
  await updateRemoteServers(argv, token);
  await updateIdmEndpoints(argv, token);
  await updateConnectorDefinitions(argv, token);
  await updateConnectorMappings(argv, token);
  await updateCors(argv, token);
  await updateEmailTemplates(argv, token);
  await updateThemes(argv, token);
  await updateKba(argv, token);
  await updatePasswordPolicy(argv, token);
  await updateTermsAndConditions(argv, token);
  await updateIdmAccessConfig(argv, token);
  await updateIdmSchedules(argv, token);
  await updateEmailProvider(argv, token);
  await updateLocales(argv, token);
  await updateAudit(argv, token);
  await updateConfigMetadata(argv, token);
  await updateOrgPrivileges(argv, token);
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

async function getCommands() {
  if (process.env.TENANT_READONLY && process.env.TENANT_READONLY === "true") {
    console.error("Environment set to readonly - no push permitted");
    process.exit(1);
  }

  const command = process.argv.length > 2 ? process.argv[2] : null;
  const allowedCommands = process.env.ALLOWED_PUSH_COMMANDS;

  try {
    if (
      command &&
      allowedCommands &&
      !JSON.parse(allowedCommands).includes(command)
    ) {
      console.error("Command", command, "not permitted by configuration");
      process.exit(1);
    }
  } catch (e) {
    console.error("Error in allowed commands configuration");
    process.exit(1);
  }

  if (
    command &&
    process.env.PUSH_NAMED_ONLY &&
    process.env.PUSH_NAMED_ONLY === "true" &&
    !process.argv.includes("--name") &&
    !process.argv.includes("-n")
  ) {
    console.error("Push only permitted by name");
    process.exit(1);
  }

  process.env.CONFIG_DIR = process.env.CONFIG_DIR || process.cwd();

  const tenantUrl = process.env.TENANT_BASE_URL;

  const clientConfig = {
    clientId: process.env.SERVICE_ACCOUNT_CLIENT_ID,
    jwtIssuer: process.env.SERVICE_ACCOUNT_ID,
    privateKey: process.env.SERVICE_ACCOUNT_KEY,
    scope: process.env.SERVICE_ACCOUNT_SCOPE,
  };

  function getAccessToken() {
    if (!checkConfig()) {
      console.error("Configuration errors");
      process.exit(1);
    }

    return authenticate.getToken(tenantUrl, clientConfig);
  }

  // Script arguments
  yargs
    .usage("Usage: $0 [arguments]")
    .strict()
    .version()
    .alias("v", "version")
    .parserConfiguration({
      "parse-numbers": false,
      "camel-case-expansion": false,
    })
    .help("h")
    .alias("h", "help")
    .command({
      command: "all-static",
      desc: "Update all static configuration",
      builder: cliOptions([OPTION.METADATA]),
      handler: (argv) =>
        getAccessToken().then((token) => updateStatic(argv, token)),
    })
    .command({
      command: "access-config",
      desc: "Update access configuration",
      builder: cliOptions([]),
      handler: (argv) =>
        getAccessToken().then((token) => updateIdmAccessConfig(argv, token)),
    })
    .command({
      command: "audit",
      desc: "Update audit configuration",
      builder: cliOptions([]),
      handler: (argv) =>
        getAccessToken().then((token) => updateAudit(argv, token)),
    })
    .command({
      command: "authentication",
      desc: "Update authentication configuration",
      builder: cliOptions([OPTION.REALM]),
      handler: (argv) =>
        getAccessToken().then((token) =>
          updateRealmConfig(argv, "authentication", token)
        ),
    })
    .command({
      command: "authz-policies",
      desc: "Update authorization policies",
      builder: cliOptions([]),
      handler: (argv) =>
        getAccessToken().then((token) => updateAuthzPolicies(argv, token)),
    })
    .command({
      command: "config-metadata",
      desc: "Update configuration metadata",
      builder: cliOptions([OPTION.METADATA]),
      handler: (argv) =>
        getAccessToken().then((token) => updateConfigMetadata(argv, token)),
    })
    .command({
      command: "connector-definitions",
      desc: "Update connector definitions",
      builder: cliOptions([OPTION.NAME]),
      handler: (argv) =>
        getAccessToken().then((token) =>
          updateConnectorDefinitions(argv, token)
        ),
    })
    .command({
      command: "connector-mappings",
      desc: "Update connector mappings",
      builder: cliOptions([OPTION.NAME]),
      handler: (argv) =>
        getAccessToken().then((token) => updateConnectorMappings(argv, token)),
    })
    .command({
      command: "cors",
      desc: "Update CORS configuration",
      builder: cliOptions([]),
      handler: (argv) =>
        getAccessToken().then((token) => updateCors(argv, token)),
    })
    .command({
      command: "csp",
      desc: "Update content security policy",
      builder: cliOptions([OPTION.NAME]),
      handler: (argv) =>
        getAccessToken().then((token) => updateCsp(argv, token)),
    })
    .command({
      command: "email-provider",
      desc: "Update email provider settings",
      builder: cliOptions([]),
      handler: (argv) =>
        getAccessToken().then((token) => updateEmailProvider(argv, token)),
    })
    .command({
      command: "email-templates",
      desc: "Update email templates",
      builder: cliOptions([OPTION.NAME]),
      handler: (argv) =>
        getAccessToken().then((token) => updateEmailTemplates(argv, token)),
    })
    .command({
      command: "endpoints",
      desc: "Update custom endpoints",
      builder: cliOptions([OPTION.FILENAME_FILTER, OPTION.NAME]),
      handler: (argv) =>
        getAccessToken().then((token) => updateIdmEndpoints(argv, token)),
    })
    .command({
      command: "internal-roles",
      desc: "Update internal roles",
      builder: cliOptions([OPTION.NAME]),
      handler: (argv) =>
        getAccessToken().then((token) => updateInternalRoles(argv, token)),
    })
    .command({
      command: "journeys",
      desc: "Update authentication journeys",
      builder: cliOptions([
        OPTION.NAME,
        OPTION.REALM,
        OPTION.PUSH_DEPENDENCIES,
      ]),
      handler: (argv) =>
        getAccessToken().then((token) => updateAuthTrees(argv, token)),
    })
    .command({
      command: "kba",
      desc: "Update KBA configuration",
      builder: cliOptions([]),
      handler: (argv) =>
        getAccessToken().then((token) => updateKba(argv, token)),
    })
    .command({
      command: "locales",
      desc: "Update locales",
      builder: cliOptions([OPTION.NAME]),
      handler: (argv) =>
        getAccessToken().then((token) => updateLocales(argv, token)),
    })
    .command({
      command: "managed-objects",
      desc: "Update managed objects",
      builder: cliOptions([OPTION.NAME, OPTION.REALM]),
      handler: (argv) =>
        getAccessToken().then((token) => updateManagedObjects(argv, token)),
    })
    .command({
      command: "oauth2-agents",
      desc: "Update OAuth2 agents",
      builder: cliOptions([]),
      handler: (argv) =>
        getAccessToken().then((token) => updateAgents(argv, token)),
    })
    .command({
      command: "org-privileges",
      desc: "Update org privileges",
      builder: cliOptions([OPTION.NAME]),
      handler: (argv) =>
        getAccessToken().then((token) => updateOrgPrivileges(argv, token)),
    })
    .command({
      command: "password-policy",
      desc: "Update password policy",
      builder: cliOptions([]),
      handler: (argv) =>
        getAccessToken().then((token) => updatePasswordPolicy(argv, token)),
    })
    .command({
      command: "remote-servers",
      desc: "Update remote connector servers",
      builder: cliOptions([OPTION.NAME]),
      handler: (argv) =>
        getAccessToken().then((token) => updateRemoteServers(argv, token)),
    })
    .command({
      command: "restart",
      desc: "Restart tenant",
      builder: cliOptions([OPTION.CHECK, OPTION.WAIT, OPTION.STATUS]),
      handler: (argv) =>
        getAccessToken().then((token) => restartFidc(argv, token)),
    })
    .command({
      command: "schedules",
      desc: "Update schedules",
      builder: cliOptions([OPTION.FILENAME_FILTER, OPTION.NAME]),
      handler: (argv) =>
        getAccessToken().then((token) => updateIdmSchedules(argv, token)),
    })
    .command({
      command: "scripts",
      desc: "Update authentication scripts",
      builder: cliOptions([OPTION.FILENAME_FILTER, OPTION.NAME, OPTION.REALM]),
      handler: (argv) =>
        getAccessToken().then((token) => updateScripts(argv, token)),
    })
    .command({
      command: "secrets",
      desc: "Update secrets",
      builder: cliOptions([OPTION.NAME]),
      handler: (argv) =>
        getAccessToken().then((token) => updateSecrets(argv, token)),
    })
    .command({
      command: "secret-mappings",
      desc: "Update secret mappings",
      builder: cliOptions([OPTION.NAME, OPTION.REALM]),
      handler: (argv) =>
        getAccessToken().then((token) => updateSecretMappings(argv, token)),
    })
    .command({
      command: "service-objects",
      desc: "Update service objects",
      builder: cliOptions([]),
      handler: (argv) =>
        getAccessToken().then((token) => updateServiceObjects(argv, token)),
    })
    .command({
      command: "services",
      desc: "Update authentication services",
      builder: cliOptions([OPTION.NAME, OPTION.REALM]),
      handler: (argv) =>
        getAccessToken().then((token) => updateServices(argv, token)),
    })
    .command({
      command: "terms-and-conditions",
      desc: "Update terms and conditions",
      builder: cliOptions([OPTION.NAME]),
      handler: (argv) =>
        getAccessToken().then((token) => updateTermsAndConditions(argv, token)),
    })
    .command({
      command: "test",
      desc: "Test connection and authentication",
      builder: cliOptions([]),
      handler: (argv) =>
        getAccessToken().then((token) =>
          console.log("Connected and authenticated successfully")
        ),
    })
    .command({
      command: "themes",
      desc: "Update UI themes",
      builder: cliOptions([OPTION.NAME, OPTION.REALM]),
      handler: (argv) =>
        getAccessToken().then((token) => updateThemes(argv, token)),
    })
    .command({
      command: "ui-config",
      desc: "Update UI configuration",
      builder: cliOptions([]),
      handler: (argv) =>
        getAccessToken().then((token) => updateUiConfig(argv, token)),
    })
    .command({
      command: "variables",
      desc: "Update environment specific variables",
      builder: cliOptions([OPTION.NAME, OPTION.FORCE]),
      handler: (argv) =>
        getAccessToken().then((token) => updateVariables(argv, token)),
    })
    .demandCommand()
    .parse();
}

getCommands();
