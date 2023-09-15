const utils = require("../helpers/utils.js");
const fs = require("fs");
const axios = require("axios");
const { saveJsonToFile } = utils;
const { logPullError } = utils;
const constants = require("../../../fr-config-common/src/constants.js");
const { AuthzTypes } = constants;
const EXPORT_SUBDIR = "realm-config/agents";

async function exportConfig(exportDir, agentsConfigFile, tenantUrl, token) {
  try {
    var agents = JSON.parse(fs.readFileSync(agentsConfigFile, "utf8"));
    for (const realm of Object.keys(agents)) {
      for (const agentType of Object.keys(agents[realm])) {
        for (const agent of agents[realm][agentType]) {
          const agentId = agent.id;
          const amEndpoint = `${tenantUrl}/am/json/realms/root/realms/${realm}/realm-config/agents/${agentType}/${agentId}`;

          const response = await axios({
            method: "get",
            url: amEndpoint,
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          let config = response.data;

          config = { ...config, ...agent.overrides };

          const targetDir = `${exportDir}/realms/${realm}/${EXPORT_SUBDIR}/${agentType}`;
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
          }
          const fileName = `${targetDir}/${agentId}.json`;
          saveJsonToFile(config, fileName);
        }
      }
    }
  } catch (err) {
    logPullError(err);
  }
}

module.exports.exportConfig = exportConfig;
