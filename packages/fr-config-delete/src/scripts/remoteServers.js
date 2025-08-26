const { restGet, restPut } = require("../../../fr-config-common/src/restClient.js");

async function processRemoteServers(rcsDoc, remoteServers, name, token, idmEndpoint, dryRun) {
  let matchFound = false;
  for (const rcs of remoteServers) {
    const rcsName = rcs.name;

    if (name && name !== rcsName) {
      continue; 
    }

    matchFound = true;

    const updatedRemoteServers = rcsDoc.remoteConnectorClients.filter(rcs => rcs.name !== rcsName);

    if (dryRun) {
      console.log(`Dry run: Deleting remote server: ${rcsName}`);
      continue;
    }

    rcsDoc.remoteConnectorClients = updatedRemoteServers;

    try {
      await restPut(idmEndpoint, rcsDoc, token, null, true);
      console.log(`Deleting rcs: ${rcsName}`);
    } catch (err) {
      console.error(`Error deleting rcs ${rcsName}:`, err);
    }
  }

  if (name && !matchFound) {
    console.log(`Warning: rcs '${name}' not found.`);
  }
}

async function deleteRemoteServers(tenantUrl, name, token, dryRun) {
  try {
    const idmEndpoint = `${tenantUrl}/openidm/config/provisioner.openicf.connectorinfoprovider`;

    const response = await restGet(idmEndpoint, null, token);
    const rcsDoc = response.data;

    const remoteServers = rcsDoc.remoteConnectorClients;

    if (remoteServers.length === 0) {
      console.log("No remote servers found to delete.");
      return;
    }

    await processRemoteServers(rcsDoc, remoteServers, name, token, idmEndpoint, dryRun);

  } catch (err) {
    console.log(err);
  }
}

module.exports.deleteRemoteServers = deleteRemoteServers;