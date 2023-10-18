const {
  saveJsonToFile,
  escapePlaceholders,
} = require("../../../fr-config-common/src/utils.js");
const fs = require("fs");
const {
  restGet,
  logRestError,
} = require("../../../fr-config-common/src/restClient.js");
const constants = require("../../../fr-config-common/src/constants.js");
const { AuthzTypes } = constants;
const EXPORT_SUBDIR = "realm-config/agents";
const _ = require("lodash");

async function exportConfig(exportDir, agentsConfigFile, tenantUrl, token) {
  try {
    var agents = JSON.parse(fs.readFileSync(agentsConfigFile, "utf8"));
    for (const realm of Object.keys(agents)) {
      for (const agentType of Object.keys(agents[realm])) {
        for (const agent of agents[realm][agentType]) {
          const agentId = agent.id;
          const amEndpoint = `${tenantUrl}/am/json/realms/root/realms/${realm}/realm-config/agents/${agentType}/${agentId}`;

          const response = await restGet(amEndpoint, null, token);

          let config = escapePlaceholders(response.data);
          const mergedConfig = _.merge(config, agent.overrides);

          const targetDir = `${exportDir}/realms/${realm}/${EXPORT_SUBDIR}/${agentType}`;
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
          }
          const fileName = `${targetDir}/${agentId}.json`;
          saveJsonToFile(mergedConfig, fileName);
        }
      }
    }
  } catch (err) {
    logRestError(err);
  }
}

module.exports.exportConfig = exportConfig;
