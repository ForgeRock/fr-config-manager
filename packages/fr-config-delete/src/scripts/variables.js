const { restGet, restDelete } = require("../../../fr-config-common/src/restClient.js");

const API_VERSION = "resource=2.0";

async function processVariables(variables, name, envEndpoint, token, dryRun) {

    let matchFound = false;
    for (const variable of variables) {
      if (name && name !== variable._id) {
        continue;
      }

      matchFound = true;

      const variableId = variable._id;

      if (dryRun) {
        console.log(`Dry run: Deleting variable: ${variableId}`);
        continue;
      }

      const variablesEndpoint = `${envEndpoint}/${variableId}`;

      try {
        await restDelete(variablesEndpoint, token, API_VERSION, true);
        console.log(`Deleting variable : ${variableId}`);
      } catch (err) {
        console.error(`Failed to delete variable  ${variableId}:`, err);
      }

    }

  if (name && !matchFound) {
    console.log(`Warning: Variable '${name}' not found.`);
  }
}

async function deleteVariables(tenantUrl, name, token, dryRun) {
  try {
    const envEndpoint = `${tenantUrl}/environment/variables`;

    const response = await restGet(
      envEndpoint,
      null,
      token,
      API_VERSION
    );

    const variables = response.data.result;

    await processVariables(variables, name, envEndpoint, token, dryRun);

  } catch (err) {
    console.log(err);
  }
}

module.exports.deleteVariables = deleteVariables;
