const { readFile } = require("fs/promises");
const fs = require("fs");
const path = require("path");
const { restPut } = require("../../../fr-config-common/src/restClient");

const updateCors = async (argv, token) => {
  console.log("Updating CORS config");
  const { TENANT_BASE_URL, CONFIG_DIR } = process.env;
  try {
    // Read auth tree JSON files
    const dir = path.join(CONFIG_DIR, "/cors");
    if (!fs.existsSync(dir)) {
      console.log("Warning: no CORS config defined");
      return;
    }
    const fileContent = JSON.parse(
      await readFile(path.join(dir, "cors-config.json"))
    );
    const serviceUrl = `${TENANT_BASE_URL}/am/json/global-config/services/CorsService`;
    const idmUrl = `${TENANT_BASE_URL}/openidm/config/servletfilter/cors`;

    delete fileContent.corsServiceGlobal._rev;

    // Update Global AM CORS settings

    await restPut(
      serviceUrl,
      fileContent.corsServiceGlobal,
      token,
      "protocol=2.0,resource=1.0"
    );

    // Update IDM CORS settings

    await restPut(idmUrl, fileContent.idmCorsConfig, token);
    await Promise.all(
      // Update individual AM CORS settings

      fileContent.corsServices.map(async (corsConfigFile) => {
        const serviceConfigUrl = `${serviceUrl}/configuration/${corsConfigFile._id}`;

        await restPut(
          serviceConfigUrl,
          corsConfigFile,
          token,
          "protocol=2.0,resource=1.0"
        );

        return Promise.resolve();
      })
    );
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = updateCors;
