const fs = require("fs");
const { restGet } = require("../../../fr-config-common/src/restClient");
const {
  saveJsonToFile,
  safeFileName,
  journeyNodeNeedsScript,
} = require("../../../fr-config-common/src/utils.js");
const { exportScriptById } = require("./scripts.js");

const JOURNEY_SUB_DIR = "journeys";
const NODES_SUB_DIR = "nodes";

let journeyCache = [];

async function getCachedNode(nodeCache, nodeId, nodeType, nodeVersion, tenantUrl, realm, token) {
  if (nodeCache[nodeType] && nodeCache[nodeType][nodeVersion]) {
    const node = nodeCache[nodeType][nodeVersion].find(({ _id }) => _id === nodeId);
    if (node) {
      return node;
    }
  }

  if (!nodeCache[nodeType]) {
    nodeCache[nodeType] = {};
  }

  const amEndpoint = `${tenantUrl}/am/json/realms/root/realms/${realm}/realm-config/authentication/authenticationtrees/nodes/${nodeType}/${nodeVersion}`;

  const response = await restGet(
    amEndpoint,
    {
      _queryFilter: "true",
    },
    token,
    "resource=3.0"
  );

  nodeCache[nodeType][nodeVersion] = response.data.result;

  const node = nodeCache[nodeType][nodeVersion].find(({ _id }) => _id === nodeId);

  if (!node) {
    console.error("Could not find node id", nodeId);
    process.exit(1);
  }

  return node;
}

function fileNameFromNode(displayName, id) {
  return safeFileName(`${displayName} - ${id}`);
}

function matchJourneyName(journeys, journey, name) {
  return journey._id === name;
}

async function processJourneys(
  journeys,
  realm,
  name,
  pullDependencies,
  tenantUrl,
  token,
  exportDir,
  clean
) {
  const fileDir = `${exportDir}/${realm}/${JOURNEY_SUB_DIR}`;

  try {
    var nodeCache = {};
    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir, { recursive: true });
    }
    for (const journey of journeys) {
      if (name && !matchJourneyName(journeys, journey, name)) {
        continue;
      }

      if (name && journeyCache.includes(journey._id)) {
        continue;
      } else {
        journeyCache.push(journey._id);
      }

      const journeyDir = `${fileDir}/${safeFileName(journey._id)}`;
      const nodeDir = `${journeyDir}/${NODES_SUB_DIR}`;

      if (clean) {
        fs.rmSync(nodeDir, { recursive: true, force: true });
      }

      if (!fs.existsSync(nodeDir)) {
        fs.mkdirSync(nodeDir, { recursive: true });
      }

      for (const [nodeId, nodeInfo] of Object.entries(journey.nodes)) {
        const nodeType = nodeInfo.nodeType;
        const nodeVersion = nodeInfo.version;
        const node = await getCachedNode(
          nodeCache,
          nodeId,
          nodeType,
          nodeVersion,
          tenantUrl,
          realm,
          token
        );

        const nodeFileNameRoot = `${nodeDir}/${fileNameFromNode(nodeInfo.displayName, nodeId)}`;

        if (node._type._id === "PageNode") {
          if (!fs.existsSync(nodeFileNameRoot)) {
            fs.mkdirSync(nodeFileNameRoot, { recursive: true });
          }

          for (const subNode of node.nodes) {
            const subNodeSpec = await getCachedNode(
              nodeCache,
              subNode._id,
              subNode.nodeType,
              subNode.nodeVersion,
              tenantUrl,
              realm,
              token
            );

            const subNodeFilename = `${nodeFileNameRoot}/${fileNameFromNode(
              subNode.displayName,
              subNodeSpec._id
            )}.json`;
            saveJsonToFile(subNodeSpec, subNodeFilename, true);
            if (pullDependencies && journeyNodeNeedsScript(subNodeSpec)) {
              exportScriptById(exportDir, tenantUrl, realm, subNodeSpec.script, token);
            }
          }
        } else if (pullDependencies && journeyNodeNeedsScript(node)) {
          exportScriptById(exportDir, tenantUrl, realm, node.script, token);
        } else if (!!name && pullDependencies && node._type._id === "InnerTreeEvaluatorNode") {
          processJourneys(
            journeys,
            realm,
            node.tree,
            pullDependencies,
            tenantUrl,
            token,
            exportDir,
            clean
          );
        }

        saveJsonToFile(node, `${nodeFileNameRoot}.json`, true);
      }

      const fileName = `${journeyDir}/${journey._id}.json`;
      saveJsonToFile(journey, fileName, true);
    }
  } catch (err) {
    console.error(err);
  }
}

async function exportJourneys(exportDir, tenantUrl, realms, name, pullDependencies, clean, token) {
  for (const realm of realms) {
    try {
      const amEndpoint = `${tenantUrl}/am/json/realms/root/realms/${realm}/realm-config/authentication/authenticationtrees/trees?_queryFilter=true`;

      const response = await restGet(amEndpoint, null, token);

      const journeys = response.data.result;

      processJourneys(journeys, realm, name, pullDependencies, tenantUrl, token, exportDir, clean);
    } catch (err) {
      console.log(err);
    }
  }
}

module.exports.exportJourneys = exportJourneys;
