const utils = require("../../../fr-config-common/src/utils.js");
const fs = require("fs");
const { saveJsonToFile } = utils;
const { restGet } = require("../../../fr-config-common/src/restClient.js");
const path = require("path");
const {
  contractRequire,
} = require("../../../fr-config-common/src/expand-require");

const CUSTOM_NODES_SUBDIR = "custom-nodes";

function saveScriptToFile(node, nodeExportDir, contract) {
  const scriptFilename = `${node._id}.js`;

  let source = node.script;

  if (contract) {
    source = contractRequire(source);
  }

  source = source.replace(/\\n/, "\n");

  fs.writeFileSync(`${nodeExportDir}/${scriptFilename}`, source);
  node.script = {
    file: scriptFilename,
  };
}

function processCustomNodes(nodes, nodeExportDir, name, contract) {
  try {
    var nodeFound = false;
    nodes.forEach((node) => {
      const nodeName = node._id;
      const exportSubDir = path.join(nodeExportDir, nodeName);
      if (!fs.existsSync(exportSubDir)) {
        fs.mkdirSync(exportSubDir, { recursive: true });
      }
      if (name && name !== nodeName) {
        return;
      }

      nodeFound = true;

      saveScriptToFile(node, exportSubDir, contract);

      const fileName = `${exportSubDir}/${nodeName}.json`;
      saveJsonToFile(node, fileName);
    });

    if (name && !nodeFound) {
      console.error(`Custom node not found: ${name}`);
    }
  } catch (err) {
    console.error(err);
  }
}

async function exportCustomNodes(exportDir, tenantUrl, name, contract, token) {
  try {
    const amEndpoint = `${tenantUrl}/am/json/node-designer/node-type`;

    const response = await restGet(amEndpoint, { _queryFilter: "true" }, token);

    const nodes = response.data.result;

    const fileDir = path.join(exportDir, CUSTOM_NODES_SUBDIR, "nodes");
    processCustomNodes(nodes, fileDir, name, contract);
  } catch (err) {
    console.log(err);
  }
}

module.exports.exportCustomNodes = exportCustomNodes;
