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
const crypto = require("crypto");

function getHash(input) {
  let utf8Encode = new TextEncoder();
  binaryInput = utf8Encode.encode(input);

  const salt = crypto.randomBytes(16);
  const binaryInputAndSalt = Buffer.concat([binaryInput, salt]);

  var hash = crypto.createHash("sha512");
  var hashedInput = hash.update(binaryInputAndSalt).digest();
  var hashAndSalt = Buffer.concat([hashedInput, salt]);
  return hashAndSalt.toString("base64");
}

async function remoteSecretMatches(
  tenantUrl,
  token,
  secretId,
  secretValueBase64
) {
  const hash = getHash(atob(secretValueBase64));
  const dottedSecretId = secretId.replaceAll("-", ".");
  const evalBody = {
    type: "text/javascript",
    source: `const value = identityServer.getProperty("${dottedSecretId}"); if (!value) { response = { found: false }; } else { response = { found: true, match: openidm.matches(value, { "$crypto": { value: { algorithm: "sha-512", data: "${hash}" }, type: "salted-hash" } }) } } `,
  };

  var response = await restPost(
    `${tenantUrl}/openidm/script`,
    { _action: "eval" },
    evalBody,
    token,
    "protocol=1.0,resource=1.0"
  );

  return response.data.match;
}

const updateSecrets = async (argv, token) => {
  const { TENANT_BASE_URL } = process.env;
  const { CONFIG_DIR } = process.env;

  const requestedSecretName = argv[OPTION.NAME];
  if (requestedSecretName) {
    console.log("Updating secret", requestedSecretName);
  } else {
    console.log("Updating secrets");
  }

  let updatesMade = false;

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

      if (requestedSecretName && requestedSecretName !== secretObject._id) {
        continue;
      }

      let secretObject = JSON.parse(
        replaceEnvSpecificValues(secretFileContents, true)
      );

      const secretBaseUrl = `${TENANT_BASE_URL}/environment/secrets/${secretObject._id}`;
      const response = await restGet(
        `${secretBaseUrl}/versions`,
        null,
        token,
        "protocol=1.0,resource=1.0",
        true
      );

      const currentVersions = response ? response.data : null;

      // If simple single value, then just update with that

      if (secretObject.valueBase64) {
        if (!currentVersions) {
          secretResponse = await restPut(
            secretBaseUrl,
            secretObject,
            token,
            "protocol=1.0,resource=1.0"
          );

          updatesMade = true;
        } else if (
          await remoteSecretMatches(
            TENANT_BASE_URL,
            token,
            secretObject._id,
            secretObject.valueBase64
          )
        ) {
          console.log(`Secret ${secretObject._id} unchanged`);
        } else {
          const createUrl = `${secretBaseUrl}/versions`;
          secretResponse = await restPost(
            createUrl,
            { _action: "create" },
            secretObject,
            token,
            "protocol=1.0,resource=1.0"
          );
          updatesMade = true;
        }
        continue;
      }

      // Multiple versions pushed (legacy) - we are going to rebuild
      // the secrets in cloud to match the number of local versions

      updatesMade = true;

      const versions = secretObject.versions.sort((a, b) =>
        Number(a.version) > Number(b.version) ? 1 : -1
      );

      delete secretObject.versions;

      for (let i = 0; i < versions.length; i++) {
        if (i === 0 && !currentVersions) {
          console.log("Creating secret", secretObject._id);
          secretObject.valueBase64 = versions[i].valueBase64;
          secretResponse = await restPut(
            secretBaseUrl,
            secretObject,
            token,
            "protocol=1.0,resource=1.0"
          );
          continue;
        }

        const versionResourceUrl = `${secretBaseUrl}/versions`;
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
          `${secretBaseUrl}/versions/${currentVersion.version}`,
          token,
          "protocol=2.1,resource=1.0"
        );
      }
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }

  console.log(updatesMade ? "Changes made to secrets" : "No changes");
};

module.exports = updateSecrets;
