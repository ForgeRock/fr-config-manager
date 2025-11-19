const fs = require("fs");
const path = require("path");
const { restPut } = require("../../../fr-config-common/src/restClient");
const { replaceEnvSpecificValues } = require("../helpers/config-process");
const cliUtils = require("../helpers/cli-options");
const { replace } = require("lodash");
const { OPTION } = cliUtils;

async function pushConfig(
  dir,
  requestedCategory,
  requestedName,
  tenantUrl,
  token
) {
  let configFound = false;
  const categories = fs.readdirSync(dir);
  for (const category of categories) {
    if (requestedCategory && requestedCategory !== category) {
      continue;
    }
    const providerPath = path.join(dir, category);
    const providerFiles = fs.readdirSync(providerPath);
    for (const providerFile of providerFiles) {
      const filePath = path.join(providerPath, providerFile);
      if (!providerFile.endsWith(".json")) {
        console.error("Error - unrecognised file type", filePath);
        process.exit(1);
      }

      let provider = fs.readFileSync(filePath, "utf8");
      provider = replaceEnvSpecificValues(provider, false);
      provider = JSON.parse(provider);

      if (requestedName && requestedName !== provider.id) {
        continue;
      }

      configFound = true;
      const requestUrl = `${tenantUrl}/environment/telemetry/${category}/${provider.id}`;
      const response = await restPut(
        requestUrl,
        provider,
        token,
        "protocol=1.0,resource=1.0"
      );
    }
  }

  return configFound;
}

const updateTelemetry = async (argv, token) => {
  const { TENANT_BASE_URL } = process.env;
  const { CONFIG_DIR } = process.env;

  const requestedName = argv[OPTION.NAME];
  const requestedCategory = argv[OPTION.CATEGORY];

  if (requestedName) {
    if (!requestedCategory) {
      console.error(
        "Error: named telemetry config requires category (e.g. --category otlp)"
      );
      process.exit(1);
    }
    console.log(`Updating telemetry for ${requestedCategory}/${requestedName}`);
  } else {
    console.log("Updating telemetry");
  }

  const dir = path.join(CONFIG_DIR, "telemetry");
  if (!fs.existsSync(dir)) {
    console.log("Warning: No telemetry config defined");
    return;
  }

  const configFound = await pushConfig(
    dir,
    requestedCategory,
    requestedName,
    TENANT_BASE_URL,
    token
  );

  if (!configFound) {
    console.log("Warning: config not found");
  }
};

module.exports = updateTelemetry;
