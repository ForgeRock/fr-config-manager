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

async function cacheNodesByType(nodeCache, nodeType, tenantUrl, realm, token) {
  if (nodeCache[nodeType]) {
    return nodeCache;
  }

  const amEndpoint = `${tenantUrl}/am/json/realms/root/realms/${realm}/realm-config/authentication/authenticationtrees/nodes/${nodeType}`;

  const response = await restGet(
    amEndpoint,
    {
      _queryFilter: "true",
    },
    token
  );

  nodeCache[nodeType] = response.data.result;

  return nodeCache;
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
        nodeCache = await cacheNodesByType(
          nodeCache,
          nodeType,
          tenantUrl,
          realm,
          token
        );
        const node = nodeCache[nodeType].find(({ _id }) => _id === nodeId);

        const nodeFileNameRoot = `${nodeDir}/${fileNameFromNode(
          nodeInfo.displayName,
          nodeId
        )}`;

        if (node._type._id === "PageNode") {
          if (!fs.existsSync(nodeFileNameRoot)) {
            fs.mkdirSync(nodeFileNameRoot, { recursive: true });
          }

          for (const subNode of node.nodes) {
            nodeCache = await cacheNodesByType(
              nodeCache,
              subNode.nodeType,
              tenantUrl,
              realm,
              token
            );
            const subNodeSpec = nodeCache[subNode.nodeType].find(
              ({ _id }) => _id === subNode._id
            );
            const subNodeFilename = `${nodeFileNameRoot}/${fileNameFromNode(
              subNode.displayName,
              subNodeSpec._id
            )}.json`;
            saveJsonToFile(subNodeSpec, subNodeFilename, true);
            if (pullDependencies && journeyNodeNeedsScript(subNodeSpec)) {
              exportScriptById(
                exportDir,
                tenantUrl,
                realm,
                subNodeSpec.script,
                token
              );
            }
          }
        } else if (pullDependencies && journeyNodeNeedsScript(node)) {
          exportScriptById(exportDir, tenantUrl, realm, node.script, token);
        } else if (
          !!name &&
          pullDependencies &&
          node._type._id === "InnerTreeEvaluatorNode"
        ) {
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

async function exportJourneys(
  exportDir,
  tenantUrl,
  realms,
  name,
  pullDependencies,
  clean,
  token
) {
  for (const realm of realms) {
    try {
      const amEndpoint = `${tenantUrl}/am/json/realms/root/realms/${realm}/realm-config/authentication/authenticationtrees/trees?_queryFilter=true`;

      const response = await restGet(amEndpoint, null, token);

      const journeys = response.data.result;

      processJourneys(
        journeys,
        realm,
        name,
        pullDependencies,
        tenantUrl,
        token,
        exportDir,
        clean
      );
    } catch (err) {
      console.log(err);
    }
  }
}

module.exports.exportJourneys = exportJourneys;
