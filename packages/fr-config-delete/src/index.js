#!/usr/bin/env node

const authenticate = require("../../fr-config-common/src/authenticate.js");
// IDM Static
const endpoints = require("./scripts/endpoints.js");
const mappings = require("./scripts/mappings.js");
const termsAndConditions = require("./scripts/termsAndConditions.js");
const remoteServers = require("./scripts/remoteServers.js");
const themes = require("./scripts/themes.js");
const idmFlatConfig = require("./scripts/idmFlatConfig.js");
const idmServiceConfig = require("./scripts/idmServiceConfig.js");
// AM Static
//const scripts = require("./scripts/scripts.js");
const scripts = require("./scripts/amScripts.js");
const customNodes = require("./scripts/amCustomNodes.js");
//const journeys = require("./scripts/journeys.js");
const journeys = require("./scripts/journeys-v2.js");
const amServices = require("./scripts/amServices.js");
const secretMappings = require("./scripts/secretMappings.js");
const cors = require("./scripts/cors.js");
// Tenant Config
const secrets = require("./scripts/secrets.js");
const variables = require("./scripts/variables.js");
// AM Dynamic
//const saml = require("./scripts/saml.js");
//const oauth2Agents = require("./scripts/oauth2Agents.js");
//const authzPolicies = require("./scripts/authzPolicies.js");
// IDM Dynamic
//const internalRoles = require("./scripts/internalRoles.js");

const {
    cliOptions,
    OPTION
} = require("./helpers/cli-options");

const {
    COMMON_OPTIONS,
    COMMON_CLI_OPTIONS,
} = require("../../fr-config-common/src/cli-options.js");

const yargs = require("yargs");
require("dotenv").config();

const COMMAND = {
    CUSTOM_NODES: "custom-nodes",
    JOURNEYS: "journeys",
    SCRIPTS: "scripts",
    CORS: "cors",
    SERVICES: "services",
    SECRET_MAPPINGS: "secret-mappings",
    CONNECTOR_MAPPINGS: "mappings",
    EMAIL_TEMPLATES: "email-templates",
    KBA:"kba",
    CONNECTOR_DEFINITIONS: "connectors",
    REMOTE_SERVERS: "remote-servers",
    THEMES: "themes",
    IDM_ENDPOINTS: "endpoints",
    IDM_SCHEDULES: "schedules",
    LOCALES: "locales",
    TERMS_AND_CONDITIONS: "terms-conditions",
    SECRETS: "secrets",
    ESVS: "variables",
    TEST: "test",
    ALL_STATIC: "all-static",
    TENANT_CONFIG: "tenant-config", // TO TEST
    // DYNAMIC_CONFIG: "dynamic-config", // TO DO
};

const REQUIRED_CONFIG = [
    "TENANT_BASE_URL",
    "SERVICE_ACCOUNT_CLIENT_ID",
    "SERVICE_ACCOUNT_ID",
    "SERVICE_ACCOUNT_KEY",
    "SERVICE_ACCOUNT_SCOPE",
    "REALMS",
];

const commandHandler = async (argv) => {
    try {
        await deleteConfig(argv);
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

function logDeletion(itemType, name) {
    if (name) {
        console.log(`Deleting single ${itemType}:`, name);
    } else {
        console.log(`Deleting ${itemType}`);
    }
}

function checkConfig() {
    for (const parameter of REQUIRED_CONFIG) {
        if (!process.env[parameter]) {
            throw new Error(`Required config ${parameter} not found`);
        }
    }

    if (!process.env.ENABLE_DELETE) {
        throw new Error("fr-config-delete is currently in beta. To enable it, set ENABLE_DELETE=true in your environment");
    }
}

async function deleteConfig(argv) {
    checkConfig();

    const tenantUrl = process.env.TENANT_BASE_URL;
    const realms = argv.realm ? [argv.realm] : JSON.parse(process.env.REALMS);
    const scriptPrefixes = process.env.SCRIPT_PREFIXES;

    const clientConfig = {
        clientId: process.env.SERVICE_ACCOUNT_CLIENT_ID,
        jwtIssuer: process.env.SERVICE_ACCOUNT_ID,
        privateKey: process.env.SERVICE_ACCOUNT_KEY,
        scope: process.env.SERVICE_ACCOUNT_SCOPE,
    };

    const token = await authenticate.getToken(tenantUrl, clientConfig);
    const requestedCommand = argv._[0];

    if (requestedCommand === COMMAND.TEST) {
        console.log("Authenticated successfully");
        return;
    }

    switch (requestedCommand) {
        case COMMAND.JOURNEYS:
            logDeletion("journeys", argv[OPTION.NAME]);
            await journeys.deleteJourneys(
                tenantUrl,
                realms,
                argv[OPTION.NAME],
                token,
                argv[OPTION.DELETE_INNER_JOURNEYS],
                argv[COMMON_OPTIONS.DRY_RUN]
            );
            break;

        case COMMAND.SCRIPTS:
            logDeletion("scripts", argv[OPTION.NAME]);
            await scripts.deleteScripts(
                tenantUrl,
                realms,
                argv[OPTION.NAME],
                token,
                scriptPrefixes,
                argv[COMMON_OPTIONS.DRY_RUN]
            );
            break;

        case COMMAND.CONNECTOR_MAPPINGS:
            logDeletion("sync mappings", argv[OPTION.NAME]);
            await mappings.deleteMappings(tenantUrl, argv[OPTION.NAME], token, argv[COMMON_OPTIONS.DRY_RUN]);
            break;

        case COMMAND.IDM_ENDPOINTS:
            logDeletion("endpoints", argv[OPTION.NAME]);
            await endpoints.deleteEndpoints(tenantUrl, argv[OPTION.NAME], token, argv[COMMON_OPTIONS.DRY_RUN]);
            break;

        case COMMAND.TERMS_AND_CONDITIONS:
            logDeletion("terms-conditions", argv[OPTION.NAME]);
            await termsAndConditions.deleteTerms(tenantUrl, argv[OPTION.NAME], token, argv[COMMON_OPTIONS.DRY_RUN]);
            break;

        case COMMAND.THEMES:
            logDeletion("themes", argv[OPTION.NAME]);
            await themes.deleteThemes(realms, tenantUrl, argv[OPTION.NAME], token, argv[COMMON_OPTIONS.DRY_RUN]);
            break;

        case COMMAND.CONNECTOR_DEFINITIONS:
            logDeletion("connectors", argv[OPTION.NAME]);
            await idmServiceConfig.deleteServiceConfig(tenantUrl, argv[OPTION.NAME], token, "provisioner.openicf", argv[COMMON_OPTIONS.DRY_RUN]);
            break;

        case COMMAND.EMAIL_TEMPLATES:
            logDeletion("email-templates", argv[OPTION.NAME]);
            await idmServiceConfig.deleteServiceConfig(tenantUrl, argv[OPTION.NAME], token, "emailTemplate", argv[COMMON_OPTIONS.DRY_RUN]);
            break;

        case COMMAND.LOCALES:
            logDeletion("locales", argv[OPTION.NAME]);
            await idmServiceConfig.deleteServiceConfig(tenantUrl, argv[OPTION.NAME], token, "uilocale", argv[COMMON_OPTIONS.DRY_RUN]);
            break;

        case COMMAND.IDM_SCHEDULES:
            logDeletion("schedules", argv[OPTION.NAME]);
            await idmServiceConfig.deleteServiceConfig(tenantUrl, argv[OPTION.NAME], token, "schedule", argv[COMMON_OPTIONS.DRY_RUN]);
            break;

        case COMMAND.REMOTE_SERVERS:
            logDeletion("remote connectors server", argv[OPTION.NAME]);
            await remoteServers.deleteRemoteServers(tenantUrl, argv[OPTION.NAME], token, argv[COMMON_OPTIONS.DRY_RUN]);
            break;

        case COMMAND.KBA:
            logDeletion("kba", argv[OPTION.NAME]);
            await idmFlatConfig.deleteServiceConfig("selfservice.kba", tenantUrl, token, true, argv[COMMON_OPTIONS.DRY_RUN]);
            break;

        case COMMAND.INTERNAL_ROLES:
            logDeletion("internal roles", argv[OPTION.NAME]);
            await internalRoles.deleteInternalRoles(
                tenantUrl,
                argv[OPTION.NAME],
                token,
                argv[COMMON_OPTIONS.DRY_RUN]
            );
            break;

        case COMMAND.CORS:
            logDeletion("cors", argv[OPTION.NAME]);
            await cors.deleteCors(tenantUrl, token, argv[OPTION.NAME], argv[COMMON_OPTIONS.DRY_RUN]);
            break;
        
        case COMMAND.CUSTOM_NODES:
            logDeletion("custom-nodes", argv[OPTION.NAME]);
            await customNodes.deleteAmNodes(
                tenantUrl,
                argv[OPTION.NAME],
                token,
                argv[COMMON_OPTIONS.DRY_RUN]
            );
            break;

        case COMMAND.SERVICES:
            if (argv[OPTION.NAME] && realms.length > 1) {
                console.error("Error: Deleting a single named service is only supported when specifying a single realm. Use the --realm option to select one.");
                throw new Error("Configuration errors");
            }
            logDeletion("services", argv[OPTION.NAME]);
            await amServices.deleteAmServices(
                tenantUrl,
                realms,
                argv[OPTION.NAME],
                token,
                argv[COMMON_OPTIONS.DRY_RUN]
            );
            break;

        case COMMAND.SECRET_MAPPINGS:
            if (argv[OPTION.NAME] && realms.length > 1) {
                console.error("Error: Deleting a single named service is only supported when specifying a single realm. Use the --realm option to select one.");
                throw new Error("Configuration errors");
            }
            logDeletion("secret-mappings", argv[OPTION.NAME]);
            await secretMappings.deleteSecretMappings(
                tenantUrl,
                realms,
                argv[OPTION.NAME],
                token,
                argv[COMMON_OPTIONS.DRY_RUN]
            );
            break;

        case COMMAND.SECRETS:
            logDeletion("secrets", argv[OPTION.NAME]);
            await secrets.deleteSecrets(
                tenantUrl,
                argv[OPTION.NAME],
                token,
                argv[COMMON_OPTIONS.DRY_RUN]
            );
            break;

        case COMMAND.ESVS:
            logDeletion("variables", argv[OPTION.NAME]);
            await variables.deleteVariables(tenantUrl, argv[OPTION.NAME], token, argv[COMMON_OPTIONS.DRY_RUN]);
            break;

        case COMMAND.ALL_STATIC:
            logDeletion("journeys", null);
            await journeys.deleteJourneys(tenantUrl, realms, null, token, argv[OPTION.DELETE_INNER_JOURNEYS], argv[COMMON_OPTIONS.DRY_RUN]);

            logDeletion("services", null);
            await amServices.deleteAmServices(tenantUrl, realms, null, token, argv[COMMON_OPTIONS.DRY_RUN]);

            logDeletion("custom-nodes", null);
            await customNodes.deleteAmNodes(tenantUrl, null, token, argv[COMMON_OPTIONS.DRY_RUN]);

            logDeletion("scripts", null);
            await scripts.deleteScripts(tenantUrl, realms, null, token, scriptPrefixes, argv[COMMON_OPTIONS.DRY_RUN]);
            
            logDeletion("cors", null);
            await cors.deleteCors(tenantUrl, token, null, argv[COMMON_OPTIONS.DRY_RUN]);

            logDeletion("secret-mappings", null);
            await secretMappings.deleteSecretMappings(tenantUrl, realms, null, token, argv[COMMON_OPTIONS.DRY_RUN]);

            logDeletion("sync mappings", null);
            await mappings.deleteMappings(tenantUrl, null, token, argv[COMMON_OPTIONS.DRY_RUN]);

            logDeletion("themes", null);
            await themes.deleteThemes(realms, tenantUrl, null, token, argv[COMMON_OPTIONS.DRY_RUN]);

            logDeletion("terms-conditions", null);
            await termsAndConditions.deleteTerms(tenantUrl, null, token, argv[COMMON_OPTIONS.DRY_RUN]);

            logDeletion("endpoints", null);
            await endpoints.deleteEndpoints(tenantUrl, null, token, argv[COMMON_OPTIONS.DRY_RUN]);

            logDeletion("schedules", null);
            await idmServiceConfig.deleteServiceConfig(tenantUrl, argv[OPTION.NAME], token, "schedule", argv[COMMON_OPTIONS.DRY_RUN]);

            logDeletion("locales", null);
            await idmServiceConfig.deleteServiceConfig(tenantUrl, argv[OPTION.NAME], token, "uilocale", argv[COMMON_OPTIONS.DRY_RUN]);

            logDeletion("email-templates", null);
            await idmServiceConfig.deleteServiceConfig(tenantUrl, argv[OPTION.NAME], token, "emailTemplate", argv[COMMON_OPTIONS.DRY_RUN]);

            logDeletion("connectors", argv[OPTION.NAME]);
            await idmServiceConfig.deleteServiceConfig(tenantUrl, argv[OPTION.NAME], token, "provisioner.openicf", argv[COMMON_OPTIONS.DRY_RUN]);

            logDeletion("remote-servers", null);
            await remoteServers.deleteRemoteServers(tenantUrl, null, token, argv[COMMON_OPTIONS.DRY_RUN]);

            break;

        case COMMAND.TENANT_CONFIG:
            logDeletion("secrets", null);
            await secrets.deleteSecrets(tenantUrl, null, token, argv[COMMON_OPTIONS.DRY_RUN]);

            logDeletion("variables", null);
            await variables.deleteVariables(tenantUrl, null, token, argv[COMMON_OPTIONS.DRY_RUN]);

            break;

        default:
            console.error(`Unknown command: ${requestedCommand}`);
            throw new Error("Configuration errors");
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
        COMMAND.ALL_STATIC,
        "Delete static configuration",
        cliOptions([COMMON_OPTIONS.DRY_RUN]),
        commandHandler
    )
    .command(
        COMMAND.CONNECTOR_DEFINITIONS,
        "Delete connector cefinitions ",
        cliOptions([OPTION.NAME, COMMON_OPTIONS.DRY_RUN]),
        commandHandler
    )
    .command(
        COMMAND.CORS,
        "Delete cors",
        cliOptions([OPTION.NAME, COMMON_OPTIONS.DRY_RUN]),
        commandHandler
    )

    .command(
        COMMAND.EMAIL_TEMPLATES,
        "Delete email templates",
        cliOptions([OPTION.NAME, COMMON_OPTIONS.DRY_RUN]),
        commandHandler
    )
    .command(
        COMMAND.IDM_ENDPOINTS,
        "Delete custom endpoints",
        cliOptions([OPTION.NAME, COMMON_OPTIONS.DRY_RUN]),
        commandHandler
    )
    .command(
        COMMAND.JOURNEYS,
        "Delete a journey",
        cliOptions([
            OPTION.REALM,
            OPTION.NAME,
            OPTION.DELETE_INNER_JOURNEYS,
            COMMON_OPTIONS.DRY_RUN
        ]),
        commandHandler
    )
    .command(
        COMMAND.LOCALES,
        "Delete locales",
        cliOptions([OPTION.NAME, COMMON_OPTIONS.DRY_RUN]),
        commandHandler
    )
    .command(
        COMMAND.CONNECTOR_MAPPINGS,
        "Delete connector mappings",
        cliOptions([OPTION.NAME, COMMON_OPTIONS.DRY_RUN]),
        commandHandler
    )
    .command(
        COMMAND.REMOTE_SERVERS,
        "Delete remote connector servers",
        cliOptions([OPTION.NAME, COMMON_OPTIONS.DRY_RUN]),
        commandHandler
    )
    .command(
        COMMAND.IDM_SCHEDULES,
        "Delete schedules",
        cliOptions([OPTION.NAME, COMMON_OPTIONS.DRY_RUN]),
        commandHandler
    )
    .command(
        COMMAND.SCRIPTS,
        "Delete scripts",
        cliOptions([OPTION.REALM, OPTION.NAME, COMMON_OPTIONS.DRY_RUN]),
        commandHandler
    )
    .command(
        COMMAND.SECRET_MAPPINGS,
        "Delete secret mappings",
        cliOptions([OPTION.REALM, OPTION.NAME, COMMON_OPTIONS.DRY_RUN]),
        commandHandler
    )
    .command(
        COMMAND.SECRETS,
        "Delete secrets",
        cliOptions([OPTION.NAME, COMMON_OPTIONS.DRY_RUN]),
        commandHandler
    )
    .command(
        COMMAND.SERVICES,
        "Delete authentication services",
        cliOptions([OPTION.REALM, OPTION.NAME, COMMON_OPTIONS.DRY_RUN]),
        commandHandler
    )
    .command(
        COMMAND.CUSTOM_NODES,
        "Delete custom nodes",
        cliOptions([OPTION.NAME, COMMON_OPTIONS.DRY_RUN]),
        commandHandler
    )
    .command(
        COMMAND.TENANT_CONFIG,
        "Delete tenant config",
        cliOptions([COMMON_OPTIONS.DRY_RUN]),
        commandHandler
    )
    .command(
        COMMAND.TERMS_AND_CONDITIONS,
        "Delete terms and conditions",
        cliOptions([OPTION.NAME, COMMON_OPTIONS.DRY_RUN]),
        commandHandler
    )
    .command(
        COMMAND.THEMES,
        "Delete themes",
        cliOptions([OPTION.NAME, OPTION.REALM, COMMON_OPTIONS.DRY_RUN]),
        commandHandler
    )
    .command(
        COMMAND.ESVS,
        "Delete environment specific variables",
        cliOptions([OPTION.NAME, COMMON_OPTIONS.DRY_RUN]),
        commandHandler
    )

    //.option(COMMON_OPTIONS.DEBUG, COMMON_CLI_OPTIONS[COMMON_OPTIONS.DEBUG])
    .option(COMMON_OPTIONS.RETRIES, COMMON_CLI_OPTIONS[COMMON_OPTIONS.RETRIES])
    .option(COMMON_OPTIONS.RETRY_INTERVAL, COMMON_CLI_OPTIONS[COMMON_OPTIONS.RETRY_INTERVAL])
    .option(COMMON_OPTIONS.DRY_RUN, COMMON_CLI_OPTIONS[COMMON_OPTIONS.DRY_RUN])
    .demandCommand()
    .parse();