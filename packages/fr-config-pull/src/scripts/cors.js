const utils = require("../helpers/utils.js");
const fs = require("fs");
const {
  restGet,
  restPost,
} = require("../../../fr-config-common/src/restClient.js");
const { saveJsonToFile } = utils;
const constants = require("../../../fr-config-common/src/constants.js");
const { AuthzTypes } = constants;

const EXPORT_SUBDIR = "cors";
const EXPORT_FILENAME = "cors-config.json";

async function exportCors(exportDir, tenantUrl, token) {
  try {
    var corsConfig = {};

    const amEndpoint = `${tenantUrl}/am/json/global-config/services/CorsService`;

    const corsConfigResponse = await restGet(amEndpoint, null, token);

    corsConfig.corsServiceGlobal = corsConfigResponse.data;

    const corsConfigsResponse = await restPost(
      amEndpoint,
      {
        _action: "nextdescendents",
      },
      null,
      token,
      "protocol=2.0,resource=1.0"
    );

    corsConfig.corsServices = corsConfigsResponse.data.result;

    const idmEndpoint = `${tenantUrl}/openidm/config/servletfilter/cors`;

    const idmResponse = await restGet(idmEndpoint, null, token);

    corsConfig.idmCorsConfig = idmResponse.data;

    const corsPath = `${exportDir}/${EXPORT_SUBDIR}`;

    if (!fs.existsSync(corsPath)) {
      fs.mkdirSync(corsPath, { recursive: true });
    }
    saveJsonToFile(corsConfig, `${corsPath}/${EXPORT_FILENAME}`);
  } catch (err) {
    console.log(err);
  }
}

module.exports.exportCors = exportCors;
