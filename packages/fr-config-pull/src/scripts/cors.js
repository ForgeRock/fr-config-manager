const utils = require("./utils.js");
const fs = require("fs");
const axios = require("axios");
const { saveJsonToFile } = utils;
const constants = require("../../../fr-config-common/src/constants.js");
const { AuthzTypes } = constants;

const EXPORT_SUBDIR = "cors";
const EXPORT_FILENAME = "cors-config.json";

async function exportCors(exportDir, tenantUrl, token) {
  try {
    var corsConfig = {};

    const amEndpoint = `${tenantUrl}/am/json/global-config/services/CorsService`;

    const corsConfigResponse = await axios({
      method: "get",
      url: amEndpoint,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    corsConfig.corsServiceGlobal = corsConfigResponse.data;

    const corsConfigsResponse = await axios({
      method: "post",
      url: amEndpoint,
      params: {
        _action: "nextdescendents",
      },
      headers: {
        Authorization: `Bearer ${token}`,
        "Accept-API-Version": "protocol=2.0,resource=1.0",
        "Content-Type": "application/json",
      },
    });

    corsConfig.corsServices = corsConfigsResponse.data.result;

    const idmEndpoint = `${tenantUrl}/openidm/config/servletfilter/cors`;

    const idmResponse = await axios({
      method: "get",
      url: idmEndpoint,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

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
