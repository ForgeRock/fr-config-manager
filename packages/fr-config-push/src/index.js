#!/usr/bin/env node
const yargs = require("yargs");
const cliOptions = require("./helpers/cli-options");
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
} = require("./scripts");

require("dotenv").config();
const authenticate = require("../../fr-config-common/src/authenticate.js");

async function updateStatic(argv, token) {
  await updateScripts(argv, token);
  await updateAuthTrees(argv, token);
  await updateServices(argv, token);
  await updateRealmConfig(argv, token);
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
}

async function getCommands() {
  if (process.env.TENANT_READONLY && process.env.TENANT_READONLY === "true") {
    console.error("Environment set to readonly - no push permitted");
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
  const token = await authenticate.getToken(tenantUrl, clientConfig);

  if (!process.env.TENANT_BASE_URL) {
    console.error("Missing required environment variable: TENANT_BASE_URL");
    process.exit(1);
  }

  // Script arguments
  yargs
    .usage("Usage: $0 [arguments]")
    .version(false)
    .help("h")
    .alias("h", "help")
    .command({
      command: "journeys",
      desc: "Update Authentication Journeys",
      builder: cliOptions(["filenameFilter"]),
      handler: (argv) => updateAuthTrees(argv, token),
    })
    .command({
      command: "connector-definitions",
      desc: "Update Connector Definitions",
      builder: cliOptions([]),
      handler: (argv) => updateConnectorDefinitions(argv, token),
    })
    .command({
      command: "connector-mappings",
      desc: "Update Connector Mappings",
      builder: cliOptions([]),
      handler: (argv) => updateConnectorMappings(argv, token),
    })
    .command({
      command: "cors",
      desc: "Update ForgeRock CORS",
      builder: cliOptions([]),
      handler: (argv) => updateCors(argv, token),
    })
    .command({
      command: "managed-objects",
      desc: "Update Managed Objects",
      builder: cliOptions([]),
      handler: (argv) => updateManagedObjects(argv, token),
    })
    .command({
      command: "email-templates",
      desc: "Update Email Templates",
      builder: cliOptions([]),
      handler: (argv) => updateEmailTemplates(argv, token),
    })
    .command({
      command: "themes",
      desc: "Update Hosted UI Themes",
      builder: cliOptions([]),
      handler: (argv) => updateThemes(argv, token),
    })
    .command({
      command: "remote-servers",
      desc: "Update Remote Connector Servers",
      builder: cliOptions([]),
      handler: (argv) => updateRemoteServers(argv, token),
    })
    .command({
      command: "scripts",
      desc: "Update Scripts",
      builder: cliOptions(["filenameFilter"]),
      handler: (argv) => updateScripts(argv, token),
    })
    .command({
      command: "services",
      desc: "Update Services",
      builder: cliOptions([]),
      handler: (argv) => updateServices(argv, token),
    })
    .command({
      command: "realm-config",
      desc: "Update Realm Config",
      builder: cliOptions([]),
      handler: (argv) => updateRealmConfig(argv, token),
    })
    .command({
      command: "terms-and-conditions",
      desc: "Update Terms and Conditions",
      builder: cliOptions([]),
      handler: (argv) => updateTermsAndConditions(argv, token),
    })
    .command({
      command: "password-policy",
      desc: "Update Password Policy",
      builder: cliOptions([]),
      handler: (argv) => updatePasswordPolicy(argv, token),
    })
    .command({
      command: "ui-config",
      desc: "Update UI config",
      builder: cliOptions([]),
      handler: (argv) => updateUiConfig(argv, token),
    })
    .command({
      command: "endpoints",
      desc: "Update Custom Endpoints",
      builder: cliOptions(["filenameFilter"]),
      handler: (argv) => updateIdmEndpoints(argv, token),
    })
    .command({
      command: "schedules",
      desc: "Update Schedules",
      builder: cliOptions(["filenameFilter"]),
      handler: (argv) => updateIdmSchedules(argv, token),
    })
    .command({
      command: "access-config",
      desc: "Update Access Configuration",
      builder: cliOptions([]),
      handler: (argv) => updateIdmAccessConfig(argv, token),
    })
    .command({
      command: "kba",
      desc: "Update KBA Configuration",
      builder: cliOptions([]),
      handler: (argv) => updateKba(argv, token),
    })
    .command({
      command: "secret-mappings",
      desc: "Update Secret Mappings",
      builder: cliOptions([]),
      handler: (argv) => updateSecretMappings(argv, token),
    })
    .command({
      command: "oauth2-agents",
      desc: "Update OAuth2 Agents",
      builder: cliOptions([]),
      handler: (argv) => updateAgents(argv, token),
    })
    .command({
      command: "authz-policies",
      desc: "Update Authorization Policies",
      builder: cliOptions([]),
      handler: (argv) => updateAuthzPolicies(argv, token),
    })
    .command({
      command: "email-provider",
      desc: "Update email provider settings",
      builder: cliOptions([]),
      handler: (argv) => updateEmailProvider(argv, token),
    })
    .command({
      command: "internal-roles",
      desc: "Update internal roles",
      builder: cliOptions([]),
      handler: (argv) => updateInternalRoles(argv, token),
    })
    .command({
      command: "secrets",
      desc: "Update secrets",
      builder: cliOptions([]),
      handler: (argv) => updateSecrets(argv, token),
    })
    .command({
      command: "variables",
      desc: "Update environment specific variables",
      builder: cliOptions([]),
      handler: (argv) => updateVariables(argv, token),
    })
    .command({
      command: "restart",
      desc: "Restart tenant",
      builder: cliOptions([]),
      handler: (argv) => restartFidc(argv, token),
    })
    .command({
      command: "service-objects",
      desc: "Update service objects",
      builder: cliOptions([]),
      handler: (argv) => updateServiceObjects(argv, token),
    })
    .command({
      command: "locales",
      desc: "Update locales",
      builder: cliOptions([]),
      handler: (argv) => updateLocales(argv, token),
    })
    .command({
      command: "audit",
      desc: "Update audit configuration",
      builder: cliOptions([]),
      handler: (argv) => updateAudit(argv, token),
    })
    .command({
      command: "all-static",
      desc: "Update Static Configuration",
      builder: cliOptions([]),
      handler: (argv) => updateStatic(argv, token),
    })
    .demandCommand()
    .parse();
}

getCommands();
