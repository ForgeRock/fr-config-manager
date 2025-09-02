const path = require("path");
const { restUpsert } = require("../../../fr-config-common/src/restClient");
const fileFilter = require("../helpers/file-filter");
const { globSync } = require("glob");
const fs = require("fs");
const cliUtils = require("../helpers/cli-options");
const { request } = require("http");
const { OPTION } = cliUtils;
const {
  expandRequire,
} = require("../../../fr-config-common/src/expand-require");

async function handleCustomNode(dir, node, expand, libDir, baseUrl, token) {
  const data = fs.readFileSync(`${dir}/${node.script.file}`, "utf8");
  node.script = data;
  if (expand || process.env.EXPAND_REQUIRE === "true") {
    node.script = expandRequire(node.script, libDir);
  }

  const requestUrl = `${baseUrl}/${node._id}`;
  delete node._rev;
  await restUpsert(requestUrl, node, token, "protocol=2.0,resource=1.0");
}

const updateCustomNodes = async (argv, token) => {
  const { TENANT_BASE_URL, CONFIG_DIR, filenameFilter } = process.env;

  const requestedNodeName = argv[OPTION.NAME];
  const expand = argv[OPTION.EXPAND_REQUIRE];

  if (requestedNodeName) {
    console.log("Updating custom node", requestedNodeName);
  } else {
    console.log("Updating custom nodes");
  }

  try {
    const baseDir = path.join(CONFIG_DIR, "custom-nodes");
    const nodeDir = path.join(baseDir, "nodes");
    const libDir = path.join(baseDir, "lib");

    if (!fs.existsSync(baseDir)) {
      console.log("Warning: no custom nodes defined");
      return;
    }

    const nodeJsonFiles = globSync("*/*.json", { cwd: nodeDir });
    var nodeFound = false;

    for (const nodeJsonFile of nodeJsonFiles) {
      const customNode = JSON.parse(
        fs.readFileSync(path.join(nodeDir, nodeJsonFile))
      );

      const nodeName = customNode._id;

      if (requestedNodeName && requestedNodeName !== nodeName) {
        continue;
      }

      nodeFound = true;

      const nodeSubDir = path.dirname(nodeJsonFile);
      await handleCustomNode(
        `${nodeDir}/${nodeSubDir}`,
        customNode,
        expand,
        libDir,
        `${TENANT_BASE_URL}/am/json/node-designer/node-type`,
        token
      );
    }

    if (requestedNodeName && !nodeFound) {
      console.error(`Custom node not found: ${requestedNodeName}`);
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = updateCustomNodes;
