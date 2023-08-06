const utils = require("./utils.js");
const fs = require("fs");
const axios = require("axios");
const { saveJsonToFile } = utils;

const CONNECTORS_SUBDIR = "sync/connectors";

function processConnectors(connectors, fileDir, name) {
  try {
    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir, { recursive: true });
    }

    connectors.forEach((connector) => {
      const connectorName = connector._id.split("/")[1];
      if (name && name !== connectorName) {
        return;
      }
      const fileName = `${fileDir}/${connectorName}.json`;
      saveJsonToFile(connector, fileName);
    });
  } catch (err) {
    console.error(err);
  }
}

async function exportConnectors(exportDir, tenantUrl, name, token) {
  try {
    const idmEndpoint = `${tenantUrl}/openidm/config`;

    const response = await axios({
      method: "get",
      url: idmEndpoint,
      params: { _queryFilter: '_id sw "provisioner.openicf/"' },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const connectors = response.data.result;

    const fileDir = `${exportDir}/${CONNECTORS_SUBDIR}`;
    processConnectors(connectors, fileDir, name);
  } catch (err) {
    console.log(err);
  }
}

module.exports.exportConnectors = exportConnectors;
