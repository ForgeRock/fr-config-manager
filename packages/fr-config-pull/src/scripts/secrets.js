const fs = require("fs");
const { restGet } = require("../../../fr-config-common/src/restClient.js");
const {
  saveJsonToFile,
  esvToEnv,
  escapePlaceholders,
  csvEscape,
  friendlyTimestamp,
} = require("../../../fr-config-common/src/utils.js");

const EXPORT_SUBDIR = "esvs/secrets";

async function exportConfig(exportDir, tenantUrl, name, activeOnly, report, token) {
  try {
    const envEndpoint = `${tenantUrl}/environment/secrets`;

    const response = await restGet(envEndpoint, null, token, "protocol=1.0,resource=1.0");

    const secrets = response.data.result;

    const targetDir = `${exportDir}/${EXPORT_SUBDIR}`;
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    let reportFirstLine = true;

    for (const secret of secrets) {
      if (name && name !== secret._id) {
        return;
      }

      if (report) {
        if (reportFirstLine) {
          reportFirstLine = false;
          console.log("Name, Description, Encoding, Use in Placeholders, Last Changed");
        }

        const fields = [
          secret._id,
          csvEscape(secret.description),
          secret.encoding,
          secret.useInPlaceholders,
          friendlyTimestamp(secret.lastChangeDate),
        ];
        console.log(fields.join(","));
        continue;
      }

      let secretObject = {
        _id: secret._id,
        encoding: secret.encoding,
        useInPlaceholders: secret.useInPlaceholders,
        description: escapePlaceholders(secret.description),
      };

      if (activeOnly) {
        secretObject.valueBase64 = "${" + esvToEnv(`${secret._id}`) + "}";
      } else {
        const versionsEndpoint = `${tenantUrl}/environment/secrets/${secret._id}/versions`;

        const versionsResponse = await restGet(
          versionsEndpoint,
          null,
          token,
          "protocol=1.0,resource=1.0"
        );

        const versions = versionsResponse.data.filter(function (version) {
          return version.status !== "DESTROYED";
        });

        let versionInfo = [];

        for (let i = 0; i < versions.length; i++) {
          const version = (i + 1).toString();
          versionInfo.push({
            version: version,
            status: version.status,
            valueBase64: "${" + esvToEnv(`${secret._id}_${version}`) + "}",
          });
        }

        secretObject.versions = versionInfo;
      }

      const fileName = `${targetDir}/${secret._id}.json`;
      saveJsonToFile(secretObject, fileName);
    }
  } catch (err) {
    console.log(err);
  }
}

module.exports.exportConfig = exportConfig;
