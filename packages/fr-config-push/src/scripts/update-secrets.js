const {
  restPut,
  restGet,
  restPost,
  restDelete,
} = require("../../../fr-config-common/src/restClient");
const replaceEnvSpecificValues =
  require("../helpers/config-process").replaceEnvSpecificValues;
const path = require("path");
const fs = require("fs");
const cliUtils = require("../helpers/cli-options");
const { OPTION } = cliUtils;

const updateSecrets = async (argv, token) => {
  const { TENANT_BASE_URL } = process.env;
  const { CONFIG_DIR } = process.env;

  const requestedSecretName = argv[OPTION.NAME];
  if (requestedSecretName) {
    console.log("Updating secret", requestedSecretName);
  } else {
    console.log("Updating secrets");
  }

  try {
    const dir = path.join(CONFIG_DIR, "esvs/secrets");
    if (!fs.existsSync(dir)) {
      console.log("Warning: No secrets defined");
      return;
    }
    const secretFiles = fs
      .readdirSync(dir)
      .filter((name) => path.extname(name) === ".json");

    for (const secretFile of secretFiles) {
      var secretFileContents = fs.readFileSync(
        path.join(dir, secretFile),
        "utf8"
      );

      let secretObject = JSON.parse(
        replaceEnvSpecificValues(secretFileContents, true)
      );

      if (requestedSecretName && requestedSecretName !== secretObject._id) {
        continue;
      }

      const resourceUrl = `${TENANT_BASE_URL}/environment/secrets/${secretObject._id}`;
      const response = await restGet(
        `${resourceUrl}/versions`,
        null,
        token,
        "protocol=1.0,resource=1.0",
        true
      );

      const currentVersions = response ? response.data : null;

      const versions = secretObject.versions.sort((a, b) =>
        Number(a.version) > Number(b.version) ? 1 : -1
      );

      delete secretObject.versions;

      for (let i = 0; i < versions.length; i++) {
        if (i === 0 && !currentVersions) {
          console.log("Creating secret", secretObject._id);
          secretObject.valueBase64 = versions[i].valueBase64;
          secretResponse = await restPut(
            resourceUrl,
            secretObject,
            token,
            "protocol=1.0,resource=1.0"
          );
          continue;
        }

        const versionResourceUrl = `${resourceUrl}/versions`;
        const versionResponse = await restPost(
          versionResourceUrl,
          { _action: "create" },
          { valueBase64: versions[i].valueBase64 },
          token,
          "protocol=1.0,resource=1.0"
        );

        if (!versionResponse) {
          console.error("No response from version creation");
          process.exit(1);
        }
      }

      if (!currentVersions) {
        continue;
      }

      for (const currentVersion of currentVersions) {
        if (currentVersion.status === "DESTROYED") {
          continue;
        }
        await restDelete(
          `${resourceUrl}/versions/${currentVersion.version}`,
          token,
          "protocol=2.1,resource=1.0"
        );
      }
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = updateSecrets;
