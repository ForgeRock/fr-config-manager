const {
  restGet,
  restDelete,
  restPost,
} = require("../../../fr-config-common/src/restClient");

let tenantUrl, deleteInnerJourneys, dryRun, token, debug;

/**
 * Constructs the AM endpoint URL for a given realm and path.
 */
function constructAmEndpoint(realm, path) {
  return `${tenantUrl}/am/json/realms/root/realms/${realm}/${path}`;
}

/**
 * Logs a message if debug mode is enabled.
 */
function debugLog(message) {
  if (debug) {
    console.log(message);
  }
}

async function getNodeTypes(realm) {
  const amEndpoint = `${tenantUrl}/am/json/realms/root/realms/${realm}/realm-config/authentication/authenticationtrees/nodes/?_action=getAllTypes`;
  const response = await restPost(
    amEndpoint,
    null,
    null,
    token,
    "protocol=2.1,resource=1.0"
  );

  return response.data.result;
}

async function getNode(nodeId, nodeType, realm) {
  const amEndpoint = `${tenantUrl}/am/json/realms/root/realms/${realm}/realm-config/authentication/authenticationtrees/nodes/${nodeType}/${nodeId}`;
  const response = await restGet(
    amEndpoint,
    null,
    token,
    "protocol=2.1,resource=1.0"
  );
  return response.data;
}

/**
 * Deletes a node by its ID and type.
 */
async function deleteNode(nodeId, nodeType, realm) {
  const nodeUrl = constructAmEndpoint(
    realm,
    `realm-config/authentication/authenticationtrees/nodes/${nodeType}/${nodeId}`
  );
  try {
    if (dryRun) {
      console.log(`Dry run: Deleting node ${nodeId} of type ${nodeType}`);
    } else {
      await restDelete(nodeUrl, token, "protocol=2.1,resource=1.0", true);
    }
    debugLog(`Deleted node ${nodeId} of type ${nodeType}`);
  } catch (err) {
    console.error(`Error deleting node ${nodeId}: ${err}`);
  }
}

async function processSingleJourney(
  realm,
  name,
  endpoint,
  accessToken,
  innerJourneysFlag,
  dryRunFlag,
  debugFlag
) {
  if (!!endpoint) {
    tenantUrl = endpoint;
  }
  if (!!accessToken) {
    token = accessToken;
  }
  if (!!innerJourneysFlag) {
    deleteInnerJourneys = innerJourneysFlag;
  }
  if (!!dryRunFlag) {
    dryRun = dryRunFlag;
  }
  if (!!debugFlag) {
    debug = debugFlag;
  }
  debugLog(`tenantUrl: ${tenantUrl}`);
  debugLog(`Journey name: ${name}`);
  const journeysUrl = constructAmEndpoint(
    realm,
    `realm-config/authentication/authenticationtrees/trees/${encodeURIComponent(
      name
    )}`
  );
  const response = await restGet(
    journeysUrl,
    null,
    token,
    "protocol=2.1,resource=1.0",
    true
  );
  if (!response || !response.data) {
    console.error(`No journey found with name ${name}`);
    return;
  }
  const journey = response.data;

  await processJourney(journey, realm, name);
}

/**
 * Processes a single journey and its nodes.
 */
async function processJourney(journey, realm, name) {
  for (const [nodeId, nodeInfo] of Object.entries(journey.nodes)) {
    if (
      !!name &&
      !!deleteInnerJourneys &&
      nodeInfo.nodeType === "InnerTreeEvaluatorNode"
    ) {
      const node = await getNode(nodeId, nodeInfo.nodeType, realm);
      if (node.tree) {
        await processSingleJourney(realm, node.tree);
      } else {
        console.log(
          `Inner tree not found in node ${nodeId} of type ${nodeInfo.nodeType}`
        );
      }
    }
  }

  // Delete the journey
  if (dryRun) {
    console.log(`Dry run: Deleting journey ${journey._id}`);
  } else {
    //journey._id is the name of the journey, can contain trailing whitespace which must be preserved with encodeURIComponent
    const journeyUrl = constructAmEndpoint(
      realm,
      `realm-config/authentication/authenticationtrees/trees/${encodeURIComponent(
        journey._id
      )}`
    );
    await restDelete(journeyUrl, token, "protocol=2.1,resource=1.0");
  }

  // Cleanup nodes
  for (const [nodeId, nodeInfo] of Object.entries(journey.nodes)) {
    await deleteNode(nodeId, nodeInfo.nodeType, realm);
  }
}

/**
 * Processes all journeys in a realm.
 */
async function processJourneys(journeys, realm, name) {
  for (const journey of journeys) {
    await processJourney(journey, realm, name);
  }
}

/**
 * Cleans up orphaned nodes in a realm.
 */
async function cleanupNodes(realm) {
  const response = await getNodeTypes(realm);
  for (const nodeType of response) {
    const nodeTypeUrl = constructAmEndpoint(
      realm,
      `realm-config/authentication/authenticationtrees/nodes/${nodeType._id}?_queryFilter=true`
    );
    const nodes = await restGet(nodeTypeUrl, null, token);
    for (const node of nodes.data.result) {
      await deleteNode(node._id, nodeType._id, realm);
    }
  }
}

/**
 * Main function to delete journeys and optionally clean up nodes.
 */
async function deleteJourneys(
  url,
  realms,
  name,
  deleteInnerJourneysFlag,
  dryRunFlag,
  debugFlag,
  accessToken
) {
  tenantUrl = url;
  deleteInnerJourneys = deleteInnerJourneysFlag;
  dryRun = dryRunFlag;
  debug = debugFlag;
  token = accessToken;

  debugLog(`tenantUrl: ${tenantUrl}`);
  debugLog(`realms: ${realms}`);
  debugLog(`name: ${name}`);
  debugLog(`deleteInnerJourneys: ${deleteInnerJourneys}`);
  debugLog(`token: ${token}`);

  if (!!name) {
    if (realms.length > 1) {
      console.error(
        "Error: Cannot delete journey by name when multiple realms are provided"
      );
      process.exit(1);
    }

    await processSingleJourney(realms[0], name);
  } else {
    for (const realm of realms) {
      try {
        const journeysUrl = constructAmEndpoint(
          realm,
          "realm-config/authentication/authenticationtrees/trees?_queryFilter=true"
        );
        const response = await restGet(journeysUrl, null, token);
        const journeys = response.data.result;

        await processJourneys(journeys, realm, name);
        // Cleanup orphaned nodes
        await cleanupNodes(realm);
      } catch (err) {
        console.error(`Error processing realm ${realm}: ${err}`);
      }
    }
  }
}

module.exports.deleteJourneys = deleteJourneys;
module.exports.processSingleJourney = processSingleJourney;
