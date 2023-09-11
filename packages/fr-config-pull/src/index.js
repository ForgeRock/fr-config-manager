#!/usr/bin/env node

const authenticate = require("../../fr-config-common/src/authenticate.js");
const emailTemplates = require("./scripts/emailTemplates.js");
const scripts = require("./scripts/scripts.js");
const idm = require("./scripts/managed.js");
const journeys = require("./scripts/journeys.js");
const endpoints = require("./scripts/endpoints.js");
const schedules = require("./scripts/schedules.js");
const connectors = require("./scripts/connectors.js");
const mappings = require("./scripts/mappings.js");
const idmFlatConfig = require("./scripts/idmFlatConfig.js");
const cors = require("./scripts/cors.js");
const fieldPolicy = require("./scripts/fieldPolicy.js");
const themes = require("./scripts/themes.js");
const termsAndConditions = require("./scripts/termsAndConditions.js");
const amRealmConfig = require("./scripts/amRealmConfig.js");
const amServices = require("./scripts/amServices.js");
const internalRoles = require("./scripts/internalRoles.js");
const secrets = require("./scripts/secrets.js");
const variables = require("./scripts/variables.js");
const secretMappings = require("./scripts/secretMappings.js");
const constants = require("../../fr-config-common/src/constants");
const cliUtils = require("./helpers/cli-options");
const { cliOptions, OPTION } = cliUtils;
const oauth2Agents = require("./scripts/oauth2Agents.js");
const authzPolicies = require("./scripts/authzPolicies.js");
const systemUsers = require("./scripts/serviceObjects");
const locales = require("./scripts/locales");

const yargs = require("yargs");
const { showConfigMetadata } = require("./scripts/configMetadata.js");

require("dotenv").config();

const COMMAND = {
  ALL: "all",
  AUTH_TREE: "journeys",
  CONNECTOR_DEFINITIONS: "connector-definitions",
  CONNECTOR_MAPPINGS: "connector-mappings",
  CORS: "cors",
  MANAGED_OBJECTS: "managed-objects",
  EMAIL_TEMPLATES: "email-templates",
  EMAIL_PROVIDER: "email-provider",
  THEMES: "themes",
  REMOTE_SERVERS: "remote-servers",
  SCRIPTS: "scripts",
  SERVICES: "services",
  AUTHENTICATION: "authentication",
  TERMS_AND_CONDITIONS: "terms-and-conditions",
  PASSWORD_POLICY: "password-policy",
  UI_CONFIG: "ui-config",
  IDM_ENDPOINTS: "endpoints",
  IDM_SCHEDULES: "schedules",
  IDM_ACCESS_CONFIG: "access-config",
  KBA: "kba",
  INTERNAL_ROLES: "internal-roles",
  SECRETS: "secrets",
  ESVS: "variables",
  SECRET_MAPPINGS: "secret-mappings",
  OAUTH2_AGENTS: "oauth2-agents",
  AUTHZ_POLICIES: "authz-policies",
  SERVICE_OBJECTS: "service-objects",
  LOCALES: "locales",
  AUDIT: "audit",
  CONFIG_METADATA: "config-metadata",
};

function matchCommand(argv, command) {
  return argv._.includes(command) || argv._.includes(COMMAND.ALL);
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

async function getConfig(argv) {
  if (!checkConfig()) {
    console.error("Configuration errors");
    process.exit(1);
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

  const REALM_SUB_DIR = "realms";
  const RCS_SUB_DIR = "sync/rcs";

  const realmConfigDir = `${configDir}/${REALM_SUB_DIR}`;

  if (matchCommand(argv, COMMAND.EMAIL_TEMPLATES)) {
    if (argv[OPTION.NAME]) {
      console.log("Getting email template", argv[OPTION.NAME]);
    } else {
      console.log("Getting email templates");
    }

    emailTemplates.exportEmailTemplates(
      configDir,
      tenantUrl,
      argv[OPTION.NAME],
      token
    );
  }

  if (matchCommand(argv, COMMAND.EMAIL_PROVIDER)) {
    console.log("Getting email provider settings");
    idmFlatConfig.exportConfig(
      "external.email",
      configDir,
      "email-provider",
      tenantUrl,
      token
    );
  }

  if (matchCommand(argv, COMMAND.MANAGED_OBJECTS)) {
    console.log("Getting managed objects");
    idm.exportManagedObjects(configDir, tenantUrl, argv[OPTION.NAME], token);
  }

  if (matchCommand(argv, COMMAND.SCRIPTS)) {
    if (argv.name) {
      if (realms.length !== 1) {
        console.error("Error: for a named script, specify a single realm");
        process.exit(1);
      }
      console.log("Getting script", argv.name, "in realm", realms[0]);
    } else {
      console.log("Getting scripts");
    }

    scripts.exportScripts(
      realmConfigDir,
      tenantUrl,
      realms,
      scriptPrefixes,
      argv[OPTION.NAME],
      token
    );
  }

  if (matchCommand(argv, COMMAND.AUTH_TREE)) {
    if (argv.name) {
      if (realms.length !== 1) {
        console.error("Error: for a named journey, specify a single realm");
        process.exit(1);
      }
      console.log("Getting journey", argv.name, "in realm", realms[0]);
    } else {
      console.log("Getting journeys");
    }

    journeys.exportJourneys(
      realmConfigDir,
      tenantUrl,
      realms,
      argv[OPTION.NAME],
      argv[OPTION.PULL_DEPENDENCIES],
      token
    );
  }

  if (matchCommand(argv, COMMAND.IDM_ENDPOINTS)) {
    console.log("Getting endpoints");
    endpoints.exportEndpoints(configDir, tenantUrl, argv[OPTION.NAME], token);
  }

  if (matchCommand(argv, COMMAND.IDM_SCHEDULES)) {
    console.log("Getting schedules");
    schedules.exportSchedules(configDir, tenantUrl, argv[OPTION.NAME], token);
  }

  if (matchCommand(argv, COMMAND.CONNECTOR_DEFINITIONS)) {
    console.log("Getting connectors");
    connectors.exportConnectors(configDir, tenantUrl, argv[OPTION.NAME], token);
  }

  if (matchCommand(argv, COMMAND.CONNECTOR_MAPPINGS)) {
    console.log("Getting mappings");
    mappings.exportMappings(configDir, tenantUrl, argv[OPTION.NAME], token);
  }

  if (matchCommand(argv, COMMAND.IDM_ACCESS_CONFIG)) {
    console.log("Getting access config");
    idmFlatConfig.exportConfig(
      "access",
      configDir,
      "access-config",
      tenantUrl,
      token
    );
  }

  if (matchCommand(argv, COMMAND.CORS)) {
    console.log("Getting cors config");
    cors.exportCors(configDir, tenantUrl, token);
  }

  if (matchCommand(argv, COMMAND.PASSWORD_POLICY)) {
    console.log("Getting password policy");
    fieldPolicy.exportPasswordConfig(realmConfigDir, realms, tenantUrl, token);
  }

  if (matchCommand(argv, COMMAND.THEMES)) {
    console.log("Getting themes");
    themes.exportThemes(
      realmConfigDir,
      realms,
      tenantUrl,
      argv[OPTION.NAME],
      token
    );
  }

  if (matchCommand(argv, COMMAND.TERMS_AND_CONDITIONS)) {
    console.log("Getting terms and conditions");
    termsAndConditions.exportTerms(
      configDir,
      tenantUrl,
      argv[OPTION.NAME],
      token
    );
  }

  if (matchCommand(argv, COMMAND.KBA)) {
    console.log("Getting KBA");
    idmFlatConfig.exportConfig(
      "selfservice.kba",
      configDir,
      "kba",
      tenantUrl,
      token
    );
  }

  if (matchCommand(argv, COMMAND.SERVICES)) {
    if (argv.name) {
      if (realms.length !== 1) {
        console.error("Error: for a named service, specify a single realm");
        process.exit(1);
      }
      console.log("Getting service", argv.name, "in realm", realms[0]);
    } else {
      console.log("Getting services");
    }

    amServices.exportConfig(
      realmConfigDir,
      realms,
      tenantUrl,
      argv[OPTION.NAME],
      token
    );
  }

  if (matchCommand(argv, COMMAND.AUTHENTICATION)) {
    console.log("Getting authentication config");
    amRealmConfig.exportConfig(
      realmConfigDir,
      realms,
      "authentication",
      tenantUrl,
      token
    );
  }

  if (matchCommand(argv, COMMAND.REMOTE_SERVERS)) {
    console.log("Getting RCS config");
    idmFlatConfig.exportConfig(
      "provisioner.openicf.connectorinfoprovider",
      configDir,
      RCS_SUB_DIR,
      tenantUrl,
      token
    );
  }

  if (matchCommand(argv, COMMAND.UI_CONFIG)) {
    console.log("Getting UI config");
    idmFlatConfig.exportConfig(
      "ui-configuration",
      configDir,
      "ui",
      tenantUrl,
      token
    );
  }

  if (matchCommand(argv, COMMAND.INTERNAL_ROLES)) {
    console.log("Getting internal roles");
    internalRoles.exportConfig(configDir, tenantUrl, argv[OPTION.NAME], token);
  }

  if (matchCommand(argv, COMMAND.SECRETS)) {
    if (argv.name) {
      if (realms.length !== 1) {
        console.error("Error: for a named secret, specify a single realm");
        process.exit(1);
      }
      console.log("Getting secret", argv.name, "in realm", realms[0]);
    } else {
      console.log("Getting secrets");
    }

    secrets.exportConfig(configDir, tenantUrl, argv[OPTION.NAME], token);
  }

  if (matchCommand(argv, COMMAND.ESVS)) {
    console.log("Getting variables");
    variables.exportConfig(configDir, tenantUrl, argv[OPTION.NAME], token);
  }

  if (matchCommand(argv, COMMAND.SECRET_MAPPINGS)) {
    if (argv.name) {
      if (realms.length !== 1) {
        console.error(
          "Error: for a named secret mapping, specify a single realm"
        );
        process.exit(1);
      }
      console.log("Getting secret mapping", argv.name, "in realm", realms[0]);
    } else {
      console.log("Getting secret mappings");
    }
    secretMappings.exportConfig(
      realmConfigDir,
      realms,
      tenantUrl,
      argv[OPTION.NAME],
      token
    );
  }

  if (matchCommand(argv, COMMAND.LOCALES)) {
    console.log("Getting locales");
    locales.exportLocales(configDir, tenantUrl, argv[OPTION.NAME], token);
  }

  if (matchCommand(argv, COMMAND.AUDIT)) {
    console.log("Getting audit settings");
    idmFlatConfig.exportConfig("audit", configDir, "audit", tenantUrl, token);
  }

  if (matchCommand(argv, COMMAND.OAUTH2_AGENTS)) {
    if (!process.env.OAUTH2_AGENTS_CONFIG) {
      console.log(
        "Warning - no OAUTH2_AGENTS_CONFIG defined - skipping agents"
      );
    } else {
      console.log("Getting OAuth2 agents");
      oauth2Agents.exportConfig(
        configDir,
        process.env.OAUTH2_AGENTS_CONFIG,
        tenantUrl,
        token
      );
    }
  }

  if (matchCommand(argv, COMMAND.AUTHZ_POLICIES)) {
    if (!process.env.AUTHZ_POLICY_SETS_CONFIG) {
      console.log("Warning - no AUTHZ_POLICY_SETS defined - skipping policies");
    } else {
      console.log("Getting Authorization Policies");
      authzPolicies.exportConfig(
        configDir,
        process.env.AUTHZ_POLICY_SETS_CONFIG,
        tenantUrl,
        token
      );
    }
  }

  if (matchCommand(argv, COMMAND.SERVICE_OBJECTS)) {
    if (!process.env.SERVICE_OBJECTS_CONFIG) {
      console.log(
        "Warning - no SERVICE_OBJECTS_CONFIG defined - skipping service objects"
      );
    } else {
      console.log("Getting Service Objects");
      systemUsers.exportConfig(
        configDir,
        process.env.SERVICE_OBJECTS_CONFIG,
        tenantUrl,
        token
      );
    }
  }

  if (argv._.includes(COMMAND.CONFIG_METADATA)) {
    showConfigMetadata(tenantUrl, token);
  }
}

yargs
  .usage("Usage: $0 [arguments]")
  .version(false)
  .help("h")
  .alias("h", "help")
  .strict()
  .command({
    command: COMMAND.ALL,
    desc: "Get all configuration",
    builder: cliOptions([OPTION.REALM]),
    handler: (argv) => getConfig(argv),
  })
  .command({
    command: COMMAND.IDM_ACCESS_CONFIG,
    desc: "Get access configuration",
    builder: cliOptions([]),
    handler: (argv) => getConfig(argv),
  })
  .command({
    command: COMMAND.AUDIT,
    desc: "Get audit configuration",
    builder: cliOptions([]),
    handler: (argv) => getConfig(argv),
  })
  .command({
    command: COMMAND.AUTHENTICATION,
    desc: "Get authentication configuration",
    builder: cliOptions([OPTION.REALM]),
    handler: (argv) => getConfig(argv),
  })
  .command({
    command: COMMAND.AUTHZ_POLICIES,
    desc: "Get authorization policies",
    builder: cliOptions([]),
    handler: (argv) => getConfig(argv),
  })
  .command({
    command: COMMAND.CONFIG_METADATA,
    desc: "Show config metadata",
    builder: cliOptions([]),
    handler: (argv) => getConfig(argv),
  })
  .command({
    command: COMMAND.CONNECTOR_DEFINITIONS,
    desc: "Get connector cefinitions ",
    builder: cliOptions([OPTION.NAME]),
    handler: (argv) => getConfig(argv),
  })
  .command({
    command: COMMAND.CONNECTOR_MAPPINGS,
    desc: "Get connector mappings",
    builder: cliOptions([OPTION.NAME]),
    handler: (argv) => getConfig(argv),
  })
  .command({
    command: COMMAND.CORS,
    desc: "Get CORS configuration",
    builder: cliOptions([]),
    handler: (argv) => getConfig(argv),
  })
  .command({
    command: COMMAND.EMAIL_PROVIDER,
    desc: "Get email provider configuration",
    builder: cliOptions([]),
    handler: (argv) => getConfig(argv),
  })
  .command({
    command: COMMAND.EMAIL_TEMPLATES,
    desc: "Get email templates",
    builder: cliOptions([OPTION.NAME]),
    handler: (argv) => getConfig(argv),
  })
  .command({
    command: COMMAND.IDM_ENDPOINTS,
    desc: "Get custom endpoints",
    builder: cliOptions([OPTION.NAME]),
    handler: (argv) => getConfig(argv),
  })
  .command({
    command: COMMAND.INTERNAL_ROLES,
    desc: "Get internal roles",
    builder: cliOptions([OPTION.NAME]),
    handler: (argv) => getConfig(argv),
  })
  .command({
    command: COMMAND.AUTH_TREE,
    desc: "Get journeys",
    builder: cliOptions([OPTION.NAME, OPTION.REALM]),
    handler: (argv) => getConfig(argv),
  })
  .command({
    command: COMMAND.KBA,
    desc: "Get KBA configuration",
    builder: cliOptions([]),
    handler: (argv) => getConfig(argv),
  })
  .command({
    command: COMMAND.LOCALES,
    desc: "Get locales",
    builder: cliOptions([OPTION.NAME]),
    handler: (argv) => getConfig(argv),
  })
  .command({
    command: COMMAND.MANAGED_OBJECTS,
    desc: "Get managed objects",
    builder: cliOptions([OPTION.NAME]),
    handler: (argv) => getConfig(argv),
  })
  .command({
    command: COMMAND.OAUTH2_AGENTS,
    desc: "Get OAuth2 agents",
    builder: cliOptions([]),
    handler: (argv) => getConfig(argv),
  })
  .command({
    command: COMMAND.PASSWORD_POLICY,
    desc: "Get password policy",
    builder: cliOptions([OPTION.REALM]),
    handler: (argv) => getConfig(argv),
  })
  .command({
    command: COMMAND.REMOTE_SERVERS,
    desc: "Get remote connector servers",
    builder: cliOptions([OPTION.NAME]),
    handler: (argv) => getConfig(argv),
  })
  .command({
    command: COMMAND.IDM_SCHEDULES,
    desc: "Get schedules",
    builder: cliOptions([OPTION.NAME]),
    handler: (argv) => getConfig(argv),
  })
  .command({
    command: COMMAND.SCRIPTS,
    desc: "Get authentication scripts",
    builder: cliOptions([OPTION.REALM, OPTION.NAME]),
    handler: (argv) => getConfig(argv),
  })
  .command({
    command: COMMAND.SECRETS,
    desc: "Get secrets",
    builder: cliOptions([OPTION.NAME]),
    handler: (argv) => getConfig(argv),
  })
  .command({
    command: COMMAND.SECRET_MAPPINGS,
    desc: "Get secret mappings",
    builder: cliOptions([OPTION.NAME, OPTION.REALM]),
    handler: (argv) => getConfig(argv),
  })
  .command({
    command: COMMAND.SERVICE_OBJECTS,
    desc: "Get service objects",
    builder: cliOptions([]),
    handler: (argv) => getConfig(argv),
  })
  .command({
    command: COMMAND.SERVICES,
    desc: "Get authentication services",
    builder: cliOptions([OPTION.REALM, OPTION.NAME]),
    handler: (argv) => getConfig(argv),
  })
  .command({
    command: COMMAND.THEMES,
    desc: "Get UI themes",
    builder: cliOptions([OPTION.REALM, OPTION.NAME]),
    handler: (argv) => getConfig(argv),
  })
  .command({
    command: COMMAND.TERMS_AND_CONDITIONS,
    desc: "Get terms and conditions",
    builder: cliOptions([OPTION.NAME]),
    handler: (argv) => getConfig(argv),
  })
  .command({
    command: COMMAND.UI_CONFIG,
    desc: "Get UI configuration",
    builder: cliOptions([]),
    handler: (argv) => getConfig(argv),
  })
  .command({
    command: COMMAND.ESVS,
    desc: "Get environment specific variables",
    builder: cliOptions([OPTION.NAME]),
    handler: (argv) => getConfig(argv),
  })
  .option(OPTION.NAME, {
    alias: "n",
    describe: "Specific configuration item",
    type: "string",
  })
  .option(OPTION.REALM, {
    alias: "r",
    describe: "Specific realm (overrides environment)",
    type: "string",
  })
  .option(OPTION.PULL_DEPENDENCIES, {
    alias: "d",
    describe: "Pull dependencies",
    type: "boolean",
  })
  .demandCommand()
  .parse();
