const {
    restGet,
    restDelete,
    restPost,
} = require("../../../fr-config-common/src/restClient");

const API_VERSION = "protocol=2.0,resource=1.0";
const INNER_NODE = "InnerTreeEvaluatorNode"
const AUTH_TREE_PATH = "realm-config/authentication/authenticationtrees"

/**
 * Constructs the AM endpoint URL for a given realm and path.
 */
function constructAmEndpoint(tenantUrl, realm, path) {
    return `${tenantUrl}/am/json/realms/root/realms/${realm}/${path}`;
}

async function getNodeTypes(tenantUrl, realm, token) {

    const nodesEndpoint = constructAmEndpoint(
        tenantUrl,
        realm,
        `${AUTH_TREE_PATH}/nodes`
    );

    const response = await restPost(
        nodesEndpoint, {
            _action: "getAllTypes",
        },
        null,
        token,
        API_VERSION
    );

    return response.data.result;
}

async function getNode(tenantUrl, realm, token, nodeId, nodeType) {

    const nodeIdEndpoint = constructAmEndpoint(
        tenantUrl,
        realm,
        `${AUTH_TREE_PATH}/nodes/${nodeType}/${nodeId}`
    );

    try {
        const response = await restGet(nodeIdEndpoint, null, token, API_VERSION);
        return response.data;
    } catch (err) {
        if (err.response && err.response.status === 404) {
            console.error(`Error: Node with ID '${nodeId}' and type '${nodeType}' not found.`);
            return null;
        }

        console.error(`An unexpected error occurred while fetching node '${nodeId}': ${err.message}`);
        throw err;
    }
}

/**
 * Processes a single journey and its nodes.
 */
async function retrieveInnerTreeData(tenantUrl, token, realm, journeyName, deleteInnerJourneysFlag, dryRun) {

    const journeyEndpoint = constructAmEndpoint(
        tenantUrl,
        realm,
        `${AUTH_TREE_PATH}/trees/${encodeURIComponent(journeyName)}`
    );

    try {
        const response = await restGet(journeyEndpoint, null, token, API_VERSION, true);
        const journey = response.data;

        await processJourney(journey, tenantUrl, realm, token, deleteInnerJourneysFlag, dryRun);

    } catch (err) {
        if (err.response && err.response.status === 404) {
            console.error(`No imner journey found with name '${journeyName}'.`);
            return;
        }
        console.error(`An unexpected error occurred: ${err.message}`);
        throw err;
    }
}

/**
 * Processes a single journey and its nodes.
 */
async function processJourney(journey, tenantUrl, realm, token, deleteInnerJourneysFlag, dryRun, counters) {
    for (const [nodeId, nodeInfo] of Object.entries(journey.nodes)) {
        if (!!deleteInnerJourneysFlag && nodeInfo.nodeType === INNER_NODE) {
            const node = await getNode(tenantUrl, realm, token, nodeId, nodeInfo.nodeType);
            if (node.tree) {
                await retrieveInnerTreeData(tenantUrl, token, realm, node.tree, deleteInnerJourneysFlag, dryRun);
            } else {
                console.log(
                    `Inner tree not found in node ${nodeId} of type ${nodeInfo.nodeType}`
                );
            }
        }
    }

    const journeyUrl = constructAmEndpoint(
        tenantUrl,
        realm,
        `${AUTH_TREE_PATH}/trees/${encodeURIComponent(journey._id)}`
    );

    if (dryRun) {
        console.log(`Dry run: Deleting journey ${realm}/${journey._id}`);
        counters.deletedJourneys++;
    } else {
        try {
            await restDelete(journeyUrl, token, API_VERSION);
            counters.deletedJourneys++;
            console.log(`Deleting journey ${realm}/${journey._id}`);
        } catch (err) {
            console.error(`Failed to delete journey ${realm}/${journey._id}: `, err);
        }
    }


    for (const [nodeId, nodeInfo] of Object.entries(journey.nodes)) {
        if (dryRun) {
            console.log(`Dry run: Deleting journey ${journey._id} node ${nodeId} of type ${nodeInfo.nodeType}`);
            counters.deletedNodes++;
        } else {
            try {
                await deleteNode(tenantUrl, realm, token, nodeId, nodeInfo.nodeType);
                console.log(`Deleting journey ${journey._id} node: ${nodeId} of type ${nodeInfo.nodeType}`);
                counters.deletedNodes++;
            } catch (err) {
                console.error(`Failed to delete journey ${journey._id} node ${nodeId} of type ${nodeInfo.nodeType}:`, err);
            }
        }
    }

    console.log(`Deleted all nodes from journey ${realm}/${journey._id}`);
}
/**
 * Processes Journeys
 */
async function processJourneys(journeys, name, tenantUrl, realm, token, deleteInnerJourneysFlag, dryRun, counters) {

    let matchFound = false;

    for (const journey of journeys) {
        const journeyName = journey._id;

        if (name && name !== journeyName) {
            continue;
        }

        matchFound = true;

        try {
            await processJourney(journey, tenantUrl, realm, token, deleteInnerJourneysFlag, dryRun, counters);
        } catch (err) {
            console.error(`Failed to delete journey ${journeyName} in /'${realm}':`, err);
        }
    }

    if (name && !matchFound) {
        console.log(`Warning: Journey with name '${name}' in /'${realm}' not found.`);
    }
}

/**
 * Cleans up orphaned nodes in a realm.
 */
async function cleanupNodes(tenantUrl, realm, token, dryRun, counters) {
    const response = await getNodeTypes(tenantUrl, realm, token);
    for (const nodeType of response) {
        const amEndpoint = constructAmEndpoint(tenantUrl,
            realm,
            `${AUTH_TREE_PATH}/nodes/${nodeType._id}`
        );

        const response = await restGet(
            amEndpoint, {
                _queryFilter: "true",
            },
            token
        );

        const nodes = response.data.result;

        for (const node of nodes) {
            if (dryRun) {
                console.log(`Dry run: Deleting orphan node ${node._id} of type ${nodeType._id}`);
                counters.deletedOrphanNodes++;
                continue;
            }
            await deleteNode(tenantUrl, realm, token, node._id, nodeType._id);
            counters.deletedOrphanNodes++;
        }
    }
    console.log(`Deleted all orphan nodes`);
}

/**
 * Deletes a node by its ID and type.
 */
async function deleteNode(tenantUrl, realm, token, nodeId, nodeType) {
    const nodeUrl = constructAmEndpoint(tenantUrl,
        realm,
        `${AUTH_TREE_PATH}/nodes/${nodeType}/${nodeId}`
    );
    try {
        await restDelete(nodeUrl, token, API_VERSION, true);
        console.log(`Deleting node ${nodeId} of type ${nodeType}`);
    } catch (err) {
        console.error(`Error deleting node ${nodeId}: ${err}`);
    }
}

/**
 * Main function to delete journeys and optionally clean up nodes.
 */
async function deleteJourneys(tenantUrl, realms, name, token, deleteInnerJourneysFlag, dryRun) {

    const counters = {
        deletedJourneys: 0,
        deletedNodes: 0,
        deletedOrphanNodes: 0
    };

    try {
        for (const realm of realms) {

            const amEndpoint = constructAmEndpoint(tenantUrl,
                realm,
                `${AUTH_TREE_PATH}/trees`
            );

            const response = await restGet(
                amEndpoint, {
                    _queryFilter: "true",
                },
                token
            );

            const journeys = response.data.result;

            await processJourneys(journeys, name, tenantUrl, realm, token, deleteInnerJourneysFlag, dryRun, counters);

            // Cleanup orphaned nodes
            if (!name) {
                console.log(`Cleanup orphaned nodes`);
                await cleanupNodes(tenantUrl, realm, token, dryRun, counters);
            }

        }

        if (!name && dryRun) {
            console.log("--- Journey and Nodes Deletion Summary ---");
            console.log(`Journeys deleted: ${counters.deletedJourneys}`);
            console.log(`Nodes deleted: ${counters.deletedNodes}`);
            console.log(`Orphan Nodes deleted: ${counters.deletedOrphanNodes}`);
        }

    } catch (err) {
        console.log(err);
    }
}

module.exports.deleteJourneys = deleteJourneys;