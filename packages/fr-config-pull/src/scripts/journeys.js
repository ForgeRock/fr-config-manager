const axios = require("axios");
const utils = require("./utils.js");
const fs = require("fs");
const process = require("process");
const constants = require("../../../fr-config-common/src/constants.js");
const { AuthzTypes } = constants;

const { saveJsonToFile } = utils;

const JOURNEY_SUB_DIR = "journeys";
const NODES_SUB_DIR = "nodes";

async function cacheNodesByType(nodeCache, nodeType, tenantUrl, realm, token) {
  if (nodeCache[nodeType]) {
    return nodeCache;
  }

  const amEndpoint = `${tenantUrl}/am/json/realms/root/realms/${realm}/realm-config/authentication/authenticationtrees/nodes/${nodeType}`;

  const response = await axios({
    method: "get",
    url: amEndpoint,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: {
      _queryFilter: "true",
    },
  });

  nodeCache[nodeType] = response.data.result;

  return nodeCache;
}

function fileSafe(filename) {
  return filename.replaceAll("/", " ");
}

function fileNameFromNode(displayName, id) {
  return fileSafe(`${displayName} - ${id}`);
}

async function processJourneys(journeys, realm, tenantUrl, token, exportDir) {
  try {
    var nodeCache = {};
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }
    for (const journey of journeys) {
      const journeyDir = `${exportDir}/${fileSafe(journey._id)}`;
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
          }
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

async function exportJourneys(exportDir, tenantUrl, realms, token) {
  for (const realm of realms) {
    try {
      const amEndpoint = `${tenantUrl}/am/json/realms/root/realms/${realm}/realm-config/authentication/authenticationtrees/trees?_queryFilter=true`;

      const response = await axios({
        method: "get",
        url: amEndpoint,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const journeys = response.data.result;

      const fileDir = `${exportDir}/${realm}/${JOURNEY_SUB_DIR}`;
      processJourneys(journeys, realm, tenantUrl, token, fileDir);
    } catch (err) {
      console.log(err);
    }
  }
}

module.exports.exportJourneys = exportJourneys;
