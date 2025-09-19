const { restGet,restPut } = require("../../../fr-config-common/src/restClient.js");

async function processMappings(syncDoc, mappings, name, token, idmEndpoint) {
  let matchFound = false;
  for (const mapping of mappings) {
    const mappingName = mapping.name;

    if (name && name !== mappingName) {
      continue; 
    }

    matchFound = true;

    const updatedMappings = syncDoc.mappings.filter(mapping => mapping.name !== mappingName);

    syncDoc.mappings = updatedMappings;

    try {
      await restPut(idmEndpoint, syncDoc, token, null, true);
      console.log(`Successfully deleted mapping: ${mappingName}`);
    } catch (err) {
      console.error(`Error deleting mapping ${mappingName}:`, err);
    }
  }

  if (name && !matchFound) {
    console.log(`Warning: mapping '${name}' not found.`);
  }
}

async function deleteMappings(tenantUrl, name, token) {
  try {
    const idmEndpoint = `${tenantUrl}/openidm/config/sync`;

    const response = await restGet(idmEndpoint, null, token);
    const syncDoc = response.data;

    const mappings = syncDoc.mappings;

    if (mappings.length === 0) {
      console.log("No mappings found to delete.");
      return;
    }

    await processMappings(syncDoc, mappings, name, token, idmEndpoint);

  } catch (err) {
    console.log(err);
  }
}

module.exports.deleteMappings = deleteMappings;