const fs = require("fs");
const path = require("path");
const {
  restPut,
  restGet,
} = require("../../../fr-config-common/src/restClient");
const { replaceEnvSpecificValues } = require("../helpers/config-process");
const cliUtils = require("../helpers/cli-options");
const { OPTION } = cliUtils;

const updateVariables = async (argv, token) => {
  const { TENANT_BASE_URL } = process.env;
  const { CONFIG_DIR } = process.env;

  const requestedVariableName = argv[OPTION.NAME];
  const force = argv[OPTION.FORCE];

  if (requestedVariableName) {
    console.log("Updating variable", requestedVariableName);
  } else {
    console.log("Updating variables");
  }

  let updatesMade = false;

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

      if (requestedVariableName) {
        const variableId = JSON.parse(variableFileContents)._id;

        if (variableId !== requestedVariableName) {
          continue;
        }
      }

      const variableObject = JSON.parse(
        replaceEnvSpecificValues(variableFileContents, true)
      );

      if (
        !variableObject.expressionType ||
        variableObject.expressionType === ""
      ) {
        variableObject.expressionType = "string";
      }

      const requestUrl = `${TENANT_BASE_URL}/environment/variables/${variableObject._id}`;

      if (!force) {
        const response = await restGet(
          requestUrl,
          null,
          token,
          "protocol=1.0,resource=1.0",
          true
        );
        if (response) {
          const currentVariable = response.data;
          if (
            currentVariable &&
            currentVariable.valueBase64 === variableObject.valueBase64
          ) {
            console.log(`Variable ${variableObject._id} unchanged`);
            continue;
          }
        }
      }

      updatesMade = true;

      await restPut(
        requestUrl,
        variableObject,
        token,
        "protocol=1.0,resource=1.0"
      );
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }

  console.log(updatesMade ? "Changes made to variables" : "No changes");
};

module.exports = updateVariables;
