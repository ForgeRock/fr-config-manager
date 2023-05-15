const fidcRequest = require("../helpers/fidc-request");
const fidcDelete = require("../helpers/fidc-delete");
const replaceEnvSpecificValues = require("../helpers/config-process").replaceEnvSpecificValues;
const path = require("path");
const fs = require("fs");
const fidcGet = require("../helpers/fidc-get");
const fidcPost = require("../helpers/fidc-post");

const updateSecrets = async (argv, token) => {
  const { TENANT_BASE_URL } = process.env;
  const { CONFIG_DIR } = process.env;
  try {
    const dir = path.join(CONFIG_DIR, "esvs/secrets");
    if (fs.existsSync(dir)) {
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

        console.log("Processing secret", secretObject._id);

        const resourceUrl = `${TENANT_BASE_URL}/environment/secrets/${secretObject._id}`;
        const currentVersions = await fidcGet(
          `${resourceUrl}/versions`,
          token,
          true
        );

        const versions = secretObject.versions.sort((a, b) =>
          Number(a.version) > Number(b.version) ? 1 : -1
        );

        delete secretObject.versions;

        // await fidcDelete(requestUrl, token);

        for (let i = 0; i < versions.length; i++) {
          if (i === 0 && !currentVersions) {
            console.log("Creating secret", secretObject._id);
            secretObject.valueBase64 = versions[i].valueBase64;
            secretResponse = await fidcRequest(
              resourceUrl,
              secretObject,
              token
            );
            continue;
          }

          const versionResourceUrl = `${resourceUrl}/versions?_action=create`;
          const versionResponse = await fidcPost(
            versionResourceUrl,
            { valueBase64: versions[i].valueBase64 },
            token
          );

          if (!versionResponse) {
            console.error("No response from version creation");
            process.exit(1);
          }

          console.log("Added secret version", versionResponse.version);
        }

        if (!currentVersions) {
          continue;
        }

        for (const currentVersion of currentVersions) {
          if (currentVersion.status === "DESTROYED") {
            continue;
          }
          console.log("Removing version", currentVersion.version);
          await fidcDelete(
            `${resourceUrl}/versions/${currentVersion.version}`,
            token
          );
        }
      }
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = updateSecrets;
