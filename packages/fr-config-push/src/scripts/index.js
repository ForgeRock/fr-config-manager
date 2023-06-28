const updateAgents = require("./update-agents");
const updateAuthTrees = require("./update-auth-trees");
const updateConnectorDefinitions = require("./update-connector-definitions");
const updateConnectorMappings = require("./update-connector-mappings");
const updateCors = require("./update-cors");
const updateInternalRoles = require("./update-internal-roles");
const updateManagedObjects = require("./update-managed-objects");
const updateRemoteServers = require("./update-remote-servers");
const updateScripts = require("./update-scripts");
const updateServices = require("./update-services");
const updateTermsAndConditions = require("./update-terms-and-conditions");
const updatePasswordPolicy = require("./update-password-policy");
const updateUiConfig = require("./update-ui-config");
const updateIdmEndpoints = require("./update-idm-endpoints");
const updateIdmAccessConfig = require("./update-idm-access-config");
const updateVariables = require("./update-variables");
const updateSecrets = require("./update-secrets");
const restartFidc = require("./restart-fidc");
const updateEmailTemplates = require("./update-email-templates");
const updateManagedRoles = require("./udpate-managed-roles");
const updateIdmSchedules = require("./update-idm-schedules");
const updateThemes = require("./update-themes");
const updateRealmConfig = require("./update-realm-config");
const updateKba = require("./update-kba-config");
const updateSecretMappings = require("./update-secret-mappings");
const updateAuthzPolicies = require("./update-policies");
const updateEmailProvider = require("./update-email-provider");
const updateServiceObjects = require("./update-service-objects");
const updateLocales = require("./update-locales");
const updateAudit = require("./update-audit");

module.exports = {
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
  updateIdmAccessConfig,
  updateVariables,
  updateSecrets,
  restartFidc,
  updateEmailTemplates,
  updateManagedRoles,
  updateIdmSchedules,
  updateThemes,
  updateRealmConfig,
  updateKba,
  updateSecretMappings,
  updateAuthzPolicies,
  updateEmailProvider,
  updateServiceObjects,
  updateLocales,
  updateAudit,
};
