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
  updateIgaWorkflows,
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
  updateRawConfig,
  updateCookieDomains,
  updateSaml,
  updateCustomNodes,
  updateTelemetry,
  updateIdmAuthenticationConfig,
} = require("./scripts");

require("dotenv").config();
const authenticate = require("../../fr-config-common/src/authenticate.js");
const { all } = require("axios");
const {
  COMMON_OPTIONS,
  COMMON_CLI_OPTIONS,
} = require("../../fr-config-common/src/cli-options.js");
const {
  COMMAND,
  DEPLOYMENT_COMMANDS,
} = require("../../fr-config-common/src/constants.js");

async function updateStatic(argv, token) {
  await updateCustomNodes(argv, token);
  await updateScripts(argv, token);
  await updateAuthTrees(argv, token);
  await updateServices(argv, token);
  await updateSecretMappings(argv, token);
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
  await updateIdmAuthenticationConfig(argv, token);
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

function checkNamed() {
  if (
    process.env.PUSH_NAMED_ONLY &&
    process.env.PUSH_NAMED_ONLY === "true" &&
    !process.argv.includes("--name") &&
    !process.argv.includes("-n")
  ) {
    console.error("Push only permitted by name");
    process.exit(1);
  }

  return true;
}

function checkAllowedCommand() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    return true;
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

  const deploymentType = process.env.DEPLOYMENT_TYPE;
  if (
    command &&
    deploymentType &&
    DEPLOYMENT_COMMANDS[deploymentType] &&
    !DEPLOYMENT_COMMANDS[deploymentType].includes(command)
  ) {
    console.error(
      `Error: command ${command} not available for deployment type ${deploymentType}`
    );
    process.exit(1);
  }

  return true;
}

async function getCommands() {
  if (process.env.TENANT_READONLY && process.env.TENANT_READONLY === "true") {
    console.error("Environment set to readonly - no push permitted");
    process.exit(1);
  }

  checkAllowedCommand();

  process.env.CONFIG_DIR = process.env.CONFIG_DIR || process.cwd();

  const tenantUrl = process.env.TENANT_BASE_URL;

  const clientConfig = {
    clientId: process.env.SERVICE_ACCOUNT_CLIENT_ID,
    jwtIssuer: process.env.SERVICE_ACCOUNT_ID,
    privateKey: process.env.SERVICE_ACCOUNT_KEY,
    scope: process.env.SERVICE_ACCOUNT_SCOPE,
  };

  function getAccessToken() {
    return authenticate.getToken();
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
      command: COMMAND.ALL_STATIC,
      desc: "Update all static configuration",
      builder: cliOptions([OPTION.METADATA]),
      handler: (argv) =>
        getAccessToken().then((token) => updateStatic(argv, token)),
    })
    .command({
      command: COMMAND.IDM_ACCESS_CONFIG,
      desc: "Update access configuration",
      builder: cliOptions([]),
      handler: (argv) =>
        getAccessToken().then((token) => updateIdmAccessConfig(argv, token)),
    })
    .command({
      command: COMMAND.AUDIT,
      desc: "Update audit configuration",
      builder: cliOptions([]),
      handler: (argv) =>
        getAccessToken().then((token) => updateAudit(argv, token)),
    })
    .command({
      command: COMMAND.AUTHENTICATION,
      desc: "Update authentication configuration",
      builder: cliOptions([OPTION.REALM]),
      handler: (argv) =>
        getAccessToken().then((token) =>
          updateRealmConfig(argv, "authentication", token)
        ),
    })
    .command({
      command: COMMAND.AUTHZ_POLICIES,
      desc: "Update authorization policies",
      builder: cliOptions([]),
      handler: (argv) =>
        getAccessToken().then((token) => updateAuthzPolicies(argv, token)),
    })
    .command({
      command: COMMAND.CONFIG_METADATA,
      desc: "Update configuration metadata",
      builder: cliOptions([OPTION.METADATA]),
      handler: (argv) =>
        getAccessToken().then((token) => updateConfigMetadata(argv, token)),
    })
    .command({
      command: COMMAND.CONNECTOR_DEFINITIONS,
      desc: "Update connector definitions",
      builder: cliOptions([OPTION.NAME]),
      handler: (argv) =>
        checkNamed() &&
        getAccessToken().then((token) =>
          updateConnectorDefinitions(argv, token)
        ),
    })
    .command({
      command: COMMAND.CONNECTOR_MAPPINGS,
      desc: "Update connector mappings",
      builder: cliOptions([OPTION.NAME]),
      handler: (argv) =>
        checkNamed() &&
        getAccessToken().then((token) => updateConnectorMappings(argv, token)),
    })
    .command({
      command: COMMAND.COOKIE_DOMAINS,
      desc: "Update cookie domain config",
      builder: cliOptions([]),
      handler: (argv) =>
        getAccessToken().then((token) => updateCookieDomains(argv, token)),
    })
    .command({
      command: COMMAND.CORS,
      desc: "Update CORS configuration",
      builder: cliOptions([]),
      handler: (argv) =>
        getAccessToken().then((token) => updateCors(argv, token)),
    })
    .command({
      command: COMMAND.CSP,
      desc: "Update content security policy",
      builder: cliOptions([OPTION.NAME]),
      handler: (argv) =>
        checkNamed() &&
        getAccessToken().then((token) => updateCsp(argv, token)),
    })
    .command({
      command: COMMAND.CUSTOM_NODES,
      desc: "Update custom nodes",
      builder: cliOptions([OPTION.NAME, OPTION.EXPAND_REQUIRE]),
      handler: (argv) =>
        checkNamed() &&
        getAccessToken().then((token) => updateCustomNodes(argv, token)),
    })
    .command({
      command: COMMAND.EMAIL_PROVIDER,
      desc: "Update email provider settings",
      builder: cliOptions([]),
      handler: (argv) =>
        getAccessToken().then((token) => updateEmailProvider(argv, token)),
    })
    .command({
      command: COMMAND.EMAIL_TEMPLATES,
      desc: "Update email templates",
      builder: cliOptions([OPTION.NAME]),
      handler: (argv) =>
        checkNamed() &&
        getAccessToken().then((token) => updateEmailTemplates(argv, token)),
    })
    .command({
      command: COMMAND.IDM_ENDPOINTS,
      desc: "Update custom endpoints",
      builder: cliOptions([OPTION.FILENAME_FILTER, OPTION.NAME]),
      handler: (argv) =>
        checkNamed() &&
        getAccessToken().then((token) => updateIdmEndpoints(argv, token)),
    })
    .command({
      command: COMMAND.IDM_AUTHENTICATION,
      desc: "Update IDM authentication configuration",
      builder: cliOptions([]),
      handler: (argv) =>
        getAccessToken().then((token) =>
          updateIdmAuthenticationConfig(argv, token)
        ),
    })
    .command({
      command: COMMAND.IGA_WORKFLOWS,
      desc: "Update IGA workflows",
      builder: cliOptions([OPTION.NAME, OPTION.DRAFT]),
      handler: (argv) =>
        checkNamed() &&
        getAccessToken().then((token) => updateIgaWorkflows(argv, token)),
    })
    .command({
      command: COMMAND.INTERNAL_ROLES,
      desc: "Update internal roles",
      builder: cliOptions([OPTION.NAME]),
      handler: (argv) =>
        checkNamed() &&
        getAccessToken().then((token) => updateInternalRoles(argv, token)),
    })
    .command({
      command: COMMAND.AUTH_TREE,
      desc: "Update authentication journeys",
      builder: cliOptions([
        OPTION.NAME,
        OPTION.REALM,
        OPTION.PUSH_DEPENDENCIES,
        OPTION.CHECK,
      ]),
      handler: (argv) =>
        checkNamed() &&
        getAccessToken().then((token) => updateAuthTrees(argv, token)),
    })
    .command({
      command: COMMAND.KBA,
      desc: "Update KBA configuration",
      builder: cliOptions([]),
      handler: (argv) =>
        getAccessToken().then((token) => updateKba(argv, token)),
    })
    .command({
      command: COMMAND.LOCALES,
      desc: "Update locales",
      builder: cliOptions([OPTION.NAME]),
      handler: (argv) =>
        checkNamed() &&
        getAccessToken().then((token) => updateLocales(argv, token)),
    })
    .command({
      command: COMMAND.MANAGED_OBJECTS,
      desc: "Update managed objects",
      builder: cliOptions([OPTION.NAME]),
      handler: (argv) =>
        checkNamed() &&
        getAccessToken().then((token) => updateManagedObjects(argv, token)),
    })
    .command({
      command: COMMAND.OAUTH2_AGENTS,
      desc: "Update OAuth2 agents",
      builder: cliOptions([]),
      handler: (argv) =>
        getAccessToken().then((token) => updateAgents(argv, token)),
    })
    .command({
      command: COMMAND.ORG_PRIVILEGES,
      desc: "Update org privileges",
      builder: cliOptions([OPTION.NAME]),
      handler: (argv) =>
        checkNamed() &&
        getAccessToken().then((token) => updateOrgPrivileges(argv, token)),
    })
    .command({
      command: COMMAND.PASSWORD_POLICY,
      desc: "Update password policy",
      builder: cliOptions([]),
      handler: (argv) =>
        getAccessToken().then((token) => updatePasswordPolicy(argv, token)),
    })
    .command({
      command: COMMAND.RAW,
      desc: "Update raw config",
      builder: cliOptions([OPTION.PATH, OPTION.STDIN]),
      handler: (argv) =>
        getAccessToken().then((token) => updateRawConfig(argv, token)),
    })
    .command({
      command: COMMAND.REMOTE_SERVERS,
      desc: "Update remote connector servers",
      builder: cliOptions([]),
      handler: (argv) =>
        getAccessToken().then((token) => updateRemoteServers(argv, token)),
    })
    .command({
      command: COMMAND.RESTART_TENANT,
      desc: "Restart tenant",
      builder: cliOptions([OPTION.CHECK, OPTION.WAIT, OPTION.STATUS]),
      handler: (argv) =>
        getAccessToken().then((token) => restartFidc(argv, token)),
    })
    .command({
      command: COMMAND.SAML,
      desc: "Update SAML Entities",
      builder: cliOptions([OPTION.REALM, OPTION.NAME]),
      handler: (argv) =>
        checkNamed() &&
        getAccessToken().then((token) => updateSaml(argv, token)),
    })
    .command({
      command: COMMAND.IDM_SCHEDULES,
      desc: "Update schedules",
      builder: cliOptions([OPTION.FILENAME_FILTER, OPTION.NAME]),
      handler: (argv) =>
        checkNamed() &&
        getAccessToken().then((token) => updateIdmSchedules(argv, token)),
    })
    .command({
      command: COMMAND.SCRIPTS,
      desc: "Update authentication scripts",
      builder: cliOptions([OPTION.FILENAME_FILTER, OPTION.NAME, OPTION.REALM]),
      handler: (argv) =>
        checkNamed() &&
        getAccessToken().then((token) => updateScripts(argv, token)),
    })
    .command({
      command: COMMAND.SECRETS,
      desc: "Update secrets",
      builder: cliOptions([OPTION.NAME, OPTION.PRUNE]),
      handler: (argv) =>
        checkNamed() &&
        getAccessToken().then((token) => updateSecrets(argv, token)),
    })
    .command({
      command: COMMAND.SECRET_MAPPINGS,
      desc: "Update secret mappings",
      builder: cliOptions([OPTION.NAME, OPTION.REALM]),
      handler: (argv) =>
        checkNamed() &&
        getAccessToken().then((token) => updateSecretMappings(argv, token)),
    })
    .command({
      command: COMMAND.SERVICE_OBJECTS,
      desc: "Update service objects",
      builder: cliOptions([]),
      handler: (argv) =>
        getAccessToken().then((token) => updateServiceObjects(argv, token)),
    })
    .command({
      command: COMMAND.SERVICES,
      desc: "Update authentication services",
      builder: cliOptions([OPTION.NAME, OPTION.REALM]),
      handler: (argv) =>
        checkNamed() &&
        getAccessToken().then((token) => updateServices(argv, token)),
    })
    .command({
      command: COMMAND.TELEMETRY,
      desc: "Update telemetry config",
      builder: cliOptions([OPTION.NAME, OPTION.CATEGORY]),
      handler: (argv) =>
        checkNamed() &&
        getAccessToken().then((token) => updateTelemetry(argv, token)),
    })
    .command({
      command: COMMAND.TERMS_AND_CONDITIONS,
      desc: "Update terms and conditions",
      builder: cliOptions([]),
      handler: (argv) =>
        getAccessToken().then((token) => updateTermsAndConditions(argv, token)),
    })
    .command({
      command: COMMAND.TEST,
      desc: "Test connection and authentication",
      builder: cliOptions([]),
      handler: (argv) =>
        getAccessToken().then((token) =>
          console.log("Connected and authenticated successfully")
        ),
    })
    .command({
      command: COMMAND.THEMES,
      desc: "Update UI themes",
      builder: cliOptions([OPTION.NAME, OPTION.REALM]),
      handler: (argv) =>
        checkNamed() &&
        getAccessToken().then((token) => updateThemes(argv, token)),
    })
    .command({
      command: COMMAND.UI_CONFIG,
      desc: "Update UI configuration",
      builder: cliOptions([]),
      handler: (argv) =>
        getAccessToken().then((token) => updateUiConfig(argv, token)),
    })
    .command({
      command: COMMAND.ESVS,
      desc: "Update environment specific variables",
      builder: cliOptions([OPTION.NAME, OPTION.FORCE]),
      handler: (argv) =>
        checkNamed() &&
        getAccessToken().then((token) => updateVariables(argv, token)),
    })
    .option(COMMON_OPTIONS.DEBUG, COMMON_CLI_OPTIONS[COMMON_OPTIONS.DEBUG])
    .option(COMMON_OPTIONS.RETRIES, COMMON_CLI_OPTIONS[COMMON_OPTIONS.RETRIES])
    .option(
      COMMON_OPTIONS.RETRY_INTERVAL,
      COMMON_CLI_OPTIONS[COMMON_OPTIONS.RETRY_INTERVAL]
    )
    .demandCommand()
    .parse();
}

getCommands();
