const { restGet } = require("../../../fr-config-common/src/restClient");
const utils = require("../../../fr-config-common/src/utils.js");
const fs = require("fs");
const process = require("process");
const constants = require("../../../fr-config-common/src/constants.js");
const { AuthzTypes } = constants;
const scriptUtils = require("./scripts.js");
const { exportScriptById } = scriptUtils;

const { saveJsonToFile, safeFileName } = utils;

const JOURNEY_SUB_DIR = "journeys";
const NODES_SUB_DIR = "nodes";

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

function isScript(nodeSpec) {
  const id = nodeSpec._type._id;
  return id === "ScriptedDecisionNode" || id === "ConfigProviderNode";
}

async function processJourneys(
  journeys,
  realm,
  name,
  pullDependencies,
  tenantUrl,
  token,
  exportDir
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
      const journeyDir = `${fileDir}/${safeFileName(journey._id)}`;
      const nodeDir = `${journeyDir}/${NODES_SUB_DIR}`;

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
        const nodeSpec = nodeCache[nodeType].find(({ _id }) => _id === nodeId);

        const nodeFileNameRoot = `${nodeDir}/${fileNameFromNode(
          nodeInfo.displayName,
          nodeId
        )}`;

        if (nodeSpec._type._id === "PageNode") {
          if (!fs.existsSync(nodeFileNameRoot)) {
            fs.mkdirSync(nodeFileNameRoot, { recursive: true });
          }

          for (const subNode of nodeSpec.nodes) {
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
            if (pullDependencies && isScript(subNodeSpec)) {
              exportScriptById(
                exportDir,
                tenantUrl,
                realm,
                subNodeSpec.script,
                token
              );
            }
          }
        } else if (pullDependencies) {
          if (isScript(nodeSpec)) {
            exportScriptById(
              exportDir,
              tenantUrl,
              realm,
              nodeSpec.script,
              token
            );
          } else if (nodeSpec._type._id === "InnerTreeEvaluatorNode") {
            processJourneys(
              journeys,
              realm,
              nodeSpec.tree,
              pullDependencies,
              tenantUrl,
              token,
              exportDir
            );
          }
        }
        saveJsonToFile(nodeSpec, `${nodeFileNameRoot}.json`, true);
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
        exportDir
      );
    } catch (err) {
      console.log(err);
    }
  }
}

module.exports.exportJourneys = exportJourneys;
