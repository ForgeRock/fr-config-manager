const utils = require("../helpers/utils.js");
const fs = require("fs");
const { saveJsonToFile } = utils;
const { restGet } = require("../../../fr-config-common/src/restClient.js");

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

    const response = await restGet(
      idmEndpoint,
      { _queryFilter: '_id sw "provisioner.openicf/"' },
      token
    );

    const connectors = response.data.result;

    const fileDir = `${exportDir}/${CONNECTORS_SUBDIR}`;
    processConnectors(connectors, fileDir, name);
  } catch (err) {
    console.log(err);
  }
}

module.exports.exportConnectors = exportConnectors;
