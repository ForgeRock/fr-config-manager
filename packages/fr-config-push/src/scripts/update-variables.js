const fs = require("fs");
const path = require("path");
const { restPut } = require("../../../fr-config-common/src/restClient");
const { replaceEnvSpecificValues } = require("../helpers/config-process");
const cliUtils = require("../helpers/cli-options");
const { OPTION } = cliUtils;

const updateVariables = async (argv, token) => {
  const { TENANT_BASE_URL } = process.env;
  const { CONFIG_DIR } = process.env;

  const requestedVariableName = argv[OPTION.NAME];

  if (requestedVariableName) {
    console.log("Updating variable", requestedVariableName);
  } else {
    console.log("Updating variables");
  }

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

      if (
        requestedVariableName &&
        requestedVariableName !== variableObject._id
      ) {
        continue;
      }

      if (
        !variableObject.expressionType ||
        variableObject.expressionType === ""
      ) {
        variableObject.expressionType = "string";
      }

      const requestUrl = `${TENANT_BASE_URL}/environment/variables/${variableObject._id}`;
      await restPut(requestUrl, variableObject, token);
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = updateVariables;
