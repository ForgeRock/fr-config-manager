const fs = require("fs");
const { restGet } = require("../../../fr-config-common/src/restClient.js");
const { saveJsonToFile } = require("../../../fr-config-common/src/utils.js");
const path = require("path");

const EXPORT_SUBDIR = "telemetry";

function headerEnvVariable(category, name, headerName) {
  return `\${TELEMETRY_HEADER_${category}_${name}_${headerName}}`
    .replaceAll("-", "_")
    .toUpperCase();
}

async function exportConfig(exportDir, tenantUrl, name, category, token) {
  try {
    const telemetryEndpoint = `${tenantUrl}/environment/telemetry`;

    const response = await restGet(
      telemetryEndpoint,
      null,
      token,
      "protocol=1.0,resource=1.0"
    );

    const targetDir = `${exportDir}/${EXPORT_SUBDIR}`;
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const telemetryConfig = response.data;
    const telemetryCategories = Object.keys(telemetryConfig);
    let configFound = false;

    for (const telemetryCategory of telemetryCategories) {
      if (category && category !== telemetryCategory) {
        continue;
      }

      const providers = telemetryConfig[telemetryCategory];

      if (providers.length === 0) {
        continue;
      }
      const jsonDir = path.join(targetDir, telemetryCategory);
      if (!fs.existsSync(jsonDir)) {
        fs.mkdirSync(jsonDir, { recursive: true });
      }

      for (const provider of providers) {
        const providerName = provider.id;

        if (name && name !== providerName) {
          continue;
        }
        const fileName = `${jsonDir}/${provider.id}.json`;
        Object.keys(provider.headers).forEach((headerName) => {
          provider.headers[headerName] = headerEnvVariable(
            telemetryCategory,
            providerName,
            headerName
          );
        });
        saveJsonToFile(provider, fileName);
        configFound = true;
      }
    }

    if (!configFound) {
      console.log(
        "No telemetry config found",
        name ? ` for ${category}/${name}` : ""
      );
    }
  } catch (err) {
    console.log(err);
  }
}

module.exports.exportConfig = exportConfig;
