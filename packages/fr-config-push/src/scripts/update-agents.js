const fs = require("fs");
const path = require("path");
const fidcRequest = require("../helpers/fidc-request");
const replaceEnvSpecificValues = require("../helpers/config-process").replaceEnvSpecificValues;

const updateAgents = async (argv, token) => {
  const { REALMS, TENANT_BASE_URL, CONFIG_DIR } = process.env;
  for (const realm of JSON.parse(REALMS)) {
    console.log("Updating agents in realm " + realm);

    try {
      // Read agent JSON files
      const baseDir = path.join(
        CONFIG_DIR,
        `/realms/${realm}/realm-config/agents`
      );
      if (!fs.existsSync(baseDir)) {
        continue;
      }

      const agentTypes = fs.readdirSync(baseDir);
      for (const agentType of agentTypes) {
        console.log("Updating agents of type", agentType);
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
          console.log(`Updated ${agentObject._id}`);
        }
      }
    } catch (error) {
      console.error(error.message);
      process.exit(1);
    }
  }
};

module.exports = updateAgents;
