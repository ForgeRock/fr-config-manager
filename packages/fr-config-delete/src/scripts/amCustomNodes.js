const { restGet, restDelete } = require("../../../fr-config-common/src/restClient.js");

const API_VERSION = "resource=1.0";

async function deleteAmNodes(tenantUrl, id, token, dryRun) {

  let matchFound = false;
  try {

    const amEndpoint = `${tenantUrl}/am/json/node-designer/node-type`;

    const response = await restGet(amEndpoint, { _queryFilter: "true" }, token);

    const nodes = response.data.result;

      for (const node of nodes) {
        const nodeId = node._id;
        const nodeName = node.displayName;

        if (id && id !== nodeId) {
            continue;
        }

        matchFound = true;

          try {
            if (dryRun) {
              console.log(`Dry run: Deleting node with displayName ${nodeName}`);
              continue;
            }
            await restDelete(`${amEndpoint}/${nodeId}`, token, API_VERSION, true);
            console.log(`Deleting node with displayName: ${nodeName}`);
          } catch (err) {
            console.error(`Failed to delete node with displayName ${nodeName}:`, err);
          }
      }

      if (id && !matchFound) {
        console.log(`Warning: Node '${nodeName}' not found.`);
      }
  } catch (err) {
    console.log(err);
  }
}

module.exports.deleteAmNodes = deleteAmNodes;