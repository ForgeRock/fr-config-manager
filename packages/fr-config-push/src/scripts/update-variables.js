const fs = require("fs");
const path = require("path");
const fidcRequest = require("../helpers/fidc-request");
const replaceEnvSpecificValues = require("../helpers/config-process").replaceEnvSpecificValues;

const updateVariables = async (argv, token) => {
  console.log("Updating variables");
  const { TENANT_BASE_URL } = process.env;
  const { CONFIG_DIR } = process.env;
  try {
    const dir = path.join(CONFIG_DIR, "esvs/variables");
    if (!fs.existsSync(dir)) {
      console.log("Warning: No variables defined");
      return;
    }
      const variableFiles = fs
        .readdirSync(dir)
        .filter((name) => path.extname(name) === ".json");

      for (const variableFile of variableFiles) {
        var variableFileContents = fs.readFileSync(
          path.join(dir, variableFile),
          "utf8"
        );

        const variableObject = JSON.parse(
          replaceEnvSpecificValues(variableFileContents, true)
        );
        const requestUrl = `${TENANT_BASE_URL}/environment/variables/${variableObject._id}`;
        await fidcRequest(requestUrl, variableObject, token);
      }
    
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = updateVariables;
