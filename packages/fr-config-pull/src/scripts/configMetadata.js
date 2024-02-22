const { restGet } = require("../../../fr-config-common/src/restClient");

async function showConfigMetadata(tenantUrl, token) {
  try {
    const idmEndpoint = `${tenantUrl}/openidm/config/custom-config.metadata`;

    var response;

    try {
      response = await restGet(idmEndpoint, null, token, null, true);
    } catch (e) {
      console.error(
        `Bad response for config metadata: status ${e.response.status}`
      );
      return;
    }

    if (!response) {
      console.error(`Warning: no config metadata available`);
      return;
    }

    console.log(JSON.stringify(response.data, null, 2));
  } catch (err) {
    console.log(err);
  }
}

module.exports.showConfigMetadata = showConfigMetadata;
