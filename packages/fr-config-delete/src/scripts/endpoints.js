const { restGet, restDelete } = require("../../../fr-config-common/src/restClient.js");

async function processEndpoints(endpoints, name, tenantUrl, token, dryRun) {
  let matchFound = false;
  for (const endpoint of endpoints) {
    const endpointName = endpoint._id.split("/")[1];

    if (name && name !== endpointName) {
      continue;
    }

    matchFound = true;

    if (dryRun) {
      console.log(`Dry run: Deleting endpoint: ${endpointName}`);
      continue;
    }

    const idmEndpoint = `${tenantUrl}/openidm/config/${endpoint._id}`; // path endpoint/<endpointName> how _id includes the full path
    
    try {
      await restDelete(idmEndpoint, token, null, true);
      console.log(`Deleting endpoint: ${endpoint._id}`);
    } catch (err) {
      console.error(`Failed to delete endpoint ${endpoint._id}:`, err);
    }
  }
  if (name && !matchFound) {
    console.log(`Warning: endpoint '${name}' not found.`);
  }
}

async function deleteEndpoints(tenantUrl, name, token, dryRun) {
  try {
    const idmEndpoint = `${tenantUrl}/openidm/config`;

    const endpointsResponse = await restGet(
      idmEndpoint,
      {
        _queryFilter:
          '!(file pr) and _id sw "endpoint" and !(context sw "util") and !(_id eq "endpoint/linkedView")',
      },
      token
    );

    const endpoints = endpointsResponse.data.result;

    if (endpoints.length === 0) {
      console.log("No endpoints found to delete.");
      return;
    }

    await processEndpoints(endpoints, name, tenantUrl, token, dryRun);
  } catch (err) {
    console.log(err);
  }
}

module.exports.deleteEndpoints = deleteEndpoints;