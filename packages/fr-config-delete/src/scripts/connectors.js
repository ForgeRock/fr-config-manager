const { restGet, restDelete } = require("../../../fr-config-common/src/restClient.js");

async function processConnectors(connectors, name, tenantUrl, token) {
  let matchFound = false;
  for (const connector of connectors) {
    const connectorName = connector._id.split("/")[1];

    if (name && name !== connectorName) {
      continue;
    }

    matchFound = true;

    const idmEndpoint = `${tenantUrl}/openidm/config/${connector._id}`;

    console.log(`Deleting connector: ${connectorName}`);

    try {
      await restDelete(idmEndpoint, token, null, true);
      console.log(`Successfully deleted connector: ${connectorName}`);
    } catch (err) {
      console.error(`Failed to delete connector ${connectorName}:`, err);
    }
  }

  if (name && !matchFound) {
    console.log(`Warning: Connector '${name}' not found.`);
  }
}

async function deleteConnectors(tenantUrl, name, token) {
  try {
    const idmEndpoint = `${tenantUrl}/openidm/config`;

    const response = await restGet(
      idmEndpoint,
      { _queryFilter: '_id sw "provisioner.openicf/"' },
      token
    );

    const connectors = response.data.result;

    if (connectors.length === 0) {
      console.log("No connectors found to delete.");
      return;
    }

    await processConnectors(connectors, name, tenantUrl, token);

  } catch (err) {
    console.log(err);
  }
}

module.exports.deleteConnectors = deleteConnectors;