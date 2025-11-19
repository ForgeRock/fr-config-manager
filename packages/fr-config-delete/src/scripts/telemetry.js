const {
  restGet,
  restDelete,
} = require("../../../fr-config-common/src/restClient.js");

async function deleteTelemetry(
  tenantUrl,
  requestedCategory,
  requestedName,
  token,
  dryRun
) {
  let matchFound = false;

  const telemetryEndpoint = `${tenantUrl}/environment/telemetry`;

  const response = await restGet(
    telemetryEndpoint,
    null,
    token,
    "protocol=1.0,resource=1.0"
  );

  const telemetryConfig = response.data;

  const telemetryCategories = Object.keys(telemetryConfig);

  for (const telemetryCategory of telemetryCategories) {
    if (requestedCategory && requestedCategory !== telemetryCategory) {
      continue;
    }

    const providers = telemetryConfig[telemetryCategory];

    for (const provider of providers) {
      const providerName = provider.id;

      if (requestedName && requestedName !== providerName) {
        continue;
      }

      matchFound = true;
      if (dryRun) {
        console.log(
          `Dry run: Deleting telemetry config: ${telemetryCategory}/${provider.id}`
        );
        continue;
      }

      const requestUrl = `${tenantUrl}/environment/telemetry/${telemetryCategory}/${provider.id}`;

      try {
        await restDelete(requestUrl, token, null, true);
        console.log(
          `Successfully deleted telemetry config: ${telemetryCategory}/${provider.id}`
        );
      } catch (err) {
        console.error(
          `Failed to delete telemetry config; ${telemetryCategory}/${provider.id} - ${err}`
        );
        process.exit(1);
      }
    }
  }

  if (!matchFound) {
    console.log(`Warning: telemetry config not found`);
  }
}

module.exports.deleteTelemetry = deleteTelemetry;
