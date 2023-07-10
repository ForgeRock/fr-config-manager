const fs = require("fs");
const path = require("path");
const fidcRequest = require("../helpers/fidc-request");
const replaceEnvSpecificValues = require("../helpers/config-process").replaceEnvSpecificValues;

const updateAgents = async (argv, token) => {
  console.log("Updating agents");
  const { REALMS, TENANT_BASE_URL, CONFIG_DIR } = process.env;
  for (const realm of JSON.parse(REALMS)) {
   

    try {
      // Read agent JSON files
      const baseDir = path.join(
        CONFIG_DIR,
        `/realms/${realm}/realm-config/agents`
      );
      if (!fs.existsSync(baseDir)) {
        console.log("Warning: no agents config defined");
        return;
      }

      const agentTypes = fs.readdirSync(baseDir);
      for (const agentType of agentTypes) {
        const subDir = path.join(baseDir, agentType);

        const agentFiles = fs
          .readdirSync(subDir)
          .filter((name) => path.extname(name) === ".json");

        for (const agentFile of agentFiles) {
          var agentFileContents = fs.readFileSync(
            path.join(subDir, agentFile),
            "utf8"
          );
          var resolvedAgentFileContents =
            replaceEnvSpecificValues(agentFileContents);
          const agentObject = JSON.parse(resolvedAgentFileContents);
          delete agentObject._rev;
          const requestUrl = `${TENANT_BASE_URL}/am/json/realms/root/realms/${realm}/realm-config/agents/${agentType}/${agentObject._id}`;
          await fidcRequest(requestUrl, agentObject, token);
        }
      }
    } catch (error) {
      console.error(error.message);
      process.exit(1);
    }
  }
};

module.exports = updateAgents;
