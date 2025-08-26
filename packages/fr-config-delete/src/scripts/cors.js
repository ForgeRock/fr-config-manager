const {
  restPost,
  restDelete
} = require("../../../fr-config-common/src/restClient.js");

const API_VERSION = "protocol=2.0,resource=1.0";

async function deleteDescendents(amEndpoint, descendents, token, name, dryRun) {

  let matchFound = false;
  const descendentType = "configuration"

  for (const descendent of descendents) {

    const descendentName = descendent._id;

    if (name && name !== descendentName) {
      continue;
    }

    matchFound = true;

    if (dryRun) {
      console.log(`Dry run: Deleting Cors Configuration: ${descendentName}`);
      continue;
    }

    try {
      await restDelete(`${amEndpoint}/${descendentType}/${descendentName}`, token, API_VERSION, true);
      console.log(`Deleting Cors Configuration: ${descendentName}`);
    } catch (err) {
      console.error(`Failed to delete Cors Configuration ${descendentName}:`, err);
    }
  }

  if (name && !matchFound) {
    console.log(`Warning: CORS Service with ID '${name}' not found.`);
  }
}

async function deleteCors(tenantUrl, token, name, dryRun) {
  try {

    const amEndpoint = `${tenantUrl}/am/json/global-config/services/CorsService`;

    const corsConfigsResponse = await restPost(
      amEndpoint,
      {
        _action: "nextdescendents",
      },
      null,
      token,
      "protocol=2.0,resource=1.0"
    );

    const descendentsArray = corsConfigsResponse.data.result;

    // Check if there are CORS configurations to delete
    if (descendentsArray && descendentsArray.length > 0) {
      await deleteDescendents(amEndpoint, descendentsArray, token, name, dryRun);
    } else {
      console.log(`Warning: CORS service not found.`);
    }

  } catch (err) {
    console.log(err);
  }
}

module.exports.deleteCors = deleteCors;
