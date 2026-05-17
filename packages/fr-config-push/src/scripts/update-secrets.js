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
const { parallelMap } = require("../../../fr-config-common/src/utils");
const { OPTION } = cliUtils;

const DEFAULT_CONCURRENCY = 8;

function getConcurrency(concurrencyEnv) {
  const parsedConcurrency = parseInt(concurrencyEnv, 10);
  return Number.isInteger(parsedConcurrency) && parsedConcurrency > 0
    ? parsedConcurrency
    : DEFAULT_CONCURRENCY;
}

async function fetchRemoteSecrets(tenantBaseUrl, token) {
  const response = await restGet(
    `${tenantBaseUrl}/environment/secrets`,
    null,
    token,
    "protocol=1.0,resource=1.0"
  );
  const map = new Map();
  for (const secret of response.data.result) {
    map.set(secret._id, secret);
  }
  return map;
}

async function pruneSecret(
  secretBaseUrl,
  token,
  paddedSecretName,
  activeVersion
) {
  const versionsResponse = await restGet(
    `${secretBaseUrl}/versions`,
    null,
    token,
    "protocol=1.0,resource=1.0",
    true
  );
  if (!versionsResponse) {
    return;
  }
  for (const version of versionsResponse.data) {
    if (
      version.status === "ENABLED" &&
      version.loaded === false &&
      version.version !== activeVersion
    ) {
      await restDelete(
        `${secretBaseUrl}/versions/${version.version}`,
        token,
        "protocol=2.1,resource=1.0"
      );
      console.log(
        `Secret ${paddedSecretName} pruned version ${version.version}`
      );
    }
  }
}

async function pushSingleVersionSecret(
  secretBaseUrl,
  token,
  secretObject,
  paddedSecretName,
  remoteSecret
) {
  if (!remoteSecret) {
    await restPut(
      secretBaseUrl,
      secretObject,
      token,
      "protocol=1.0,resource=1.0"
    );
    console.log(`Secret ${paddedSecretName} created`);
    return { updated: true };
  }
  const response = await restPost(
    `${secretBaseUrl}/versions`,
    { _action: "create" },
    secretObject,
    token,
    "protocol=1.0,resource=1.0"
  );
  // AIC dedupes when the new value matches the latest version, returning the
  // existing active version unchanged. response.data.loaded is only true once
  // the active version has been loaded by a tenant restart, so we compare
  // versions instead to detect actual writes between restarts.
  if (response.data.version === remoteSecret.activeVersion) {
    console.log(
      `Secret ${paddedSecretName} unchanged version ${response.data.version}`
    );
    return { updated: false };
  }
  console.log(
    `Secret ${paddedSecretName} created version ${response.data.version}`
  );
  return { updated: true };
}

async function pushVersionedSecret(
  secretBaseUrl,
  token,
  secretObject,
  paddedSecretName,
  remoteSecret
) {
  // Multiple versions pushed (legacy) - versions must be pushed in order so
  // serialise the calls rather than doing in parallel
  const versions = secretObject.versions.sort((a, b) =>
    Number(a.version) > Number(b.version) ? 1 : -1
  );

  const baseObject = { ...secretObject };
  delete baseObject.versions;
  let updated = false;
  let lastKnownActiveVersion = remoteSecret ? remoteSecret.activeVersion : null;
  for (let i = 0; i < versions.length; i++) {
    if (i === 0 && !remoteSecret) {
      await restPut(
        secretBaseUrl,
        { ...baseObject, valueBase64: versions[i].valueBase64 },
        token,
        "protocol=1.0,resource=1.0"
      );
      console.log(`Secret ${paddedSecretName} created`);
      updated = true;
      continue;
    }
    const versionResponse = await restPost(
      `${secretBaseUrl}/versions`,
      { _action: "create" },
      { valueBase64: versions[i].valueBase64 },
      token,
      "protocol=1.0,resource=1.0"
    );
    if (!versionResponse) {
      throw new Error(
        `No response from version creation for ${secretObject._id}`
      );
    }
    // AIC dedupes when the new value matches the latest version. Compare the
    // returned version against the last version we know to be active rather
    // than relying on response.data.loaded (which only flips after a restart).
    if (versionResponse.data.version === lastKnownActiveVersion) {
      console.log(
        `Secret ${paddedSecretName} unchanged version ${versionResponse.data.version}`
      );
    } else {
      console.log(
        `Secret ${paddedSecretName} created version ${versionResponse.data.version}`
      );
      updated = true;
    }
    lastKnownActiveVersion = versionResponse.data.version;
  }
  return { updated };
}

const updateSecrets = async (argv, token) => {
  const { TENANT_BASE_URL, CONFIG_DIR, ESV_PUSH_CONCURRENCY } = process.env;

  const requestedSecretName = argv[OPTION.NAME];
  const prune = !!argv[OPTION.PRUNE];
  const concurrency = getConcurrency(ESV_PUSH_CONCURRENCY);

  console.log(
    requestedSecretName
      ? `Updating secret ${requestedSecretName}`
      : "Updating secrets"
  );

  const dir = path.join(CONFIG_DIR, "esvs/secrets");
  if (!fs.existsSync(dir)) {
    console.log("Warning: No secrets defined");
    return;
  }

  // Resolve env-specific placeholders only after filtering by --name. Resolving
  // first would call process.exit(1) for any unrelated file with an unset env
  // var (see helpers/config-process.js), breaking targeted pushes.
  const localSecrets = fs
    .readdirSync(dir)
    .filter((name) => path.extname(name) === ".json")
    .map((name) => fs.readFileSync(path.join(dir, name), "utf8"))
    .filter((raw) => {
      if (!requestedSecretName) {
        return true;
      }
      return JSON.parse(raw)._id === requestedSecretName;
    })
    .map((raw) => JSON.parse(replaceEnvSpecificValues(raw, true)));

  if (localSecrets.length === 0) {
    console.log("No matching secrets found to update");
    return;
  }

  let remoteSecrets = new Map();
  try {
    remoteSecrets = await fetchRemoteSecrets(TENANT_BASE_URL, token);
  } catch (error) {
    console.error(
      `Failed to pre-fetch secrets, falling back to per-secret GET: ${error.message}.`
    );
  }

  const errors = [];
  let updated = 0;
  let unchanged = 0;

  await parallelMap(localSecrets, concurrency, async (secret) => {
    const paddedSecretName = secret._id.padEnd(30);
    const secretBaseUrl = `${TENANT_BASE_URL}/environment/secrets/${secret._id}`;
    let remoteSecret = remoteSecrets.get(secret._id);
    // Defensive fallback: a map miss flows into the create path (PUT /secrets/{id}),
    // which is destructive against a secret that already exists. Confirm with a
    // per-secret GET so a malformed/incomplete bulk pre-fetch can't lose data.
    if (!remoteSecret) {
      const existing = await restGet(
        secretBaseUrl,
        null,
        token,
        "protocol=1.0,resource=1.0",
        true
      );
      if (existing) {
        remoteSecret = existing.data;
      }
    }

    try {
      if (prune && remoteSecret) {
        await pruneSecret(
          secretBaseUrl,
          token,
          paddedSecretName,
          remoteSecret.activeVersion
        );
      }

      const result = secret.valueBase64
        ? await pushSingleVersionSecret(
            secretBaseUrl,
            token,
            secret,
            paddedSecretName,
            remoteSecret
          )
        : await pushVersionedSecret(
            secretBaseUrl,
            token,
            secret,
            paddedSecretName,
            remoteSecret
          );

      if (result.updated) {
        updated++;
      } else {
        unchanged++;
      }
    } catch (error) {
      errors.push({ id: secret._id, error });
      console.error(`Failed to update secret ${secret._id}: ${error.message}`);
    }
  });

  if (errors.length > 0) {
    console.error(
      `Failed to update ${errors.length} secret${
        errors.length > 1 ? "s" : ""
      }:`,
      errors
    );
    process.exit(1);
  }

  console.log(
    updated > 0
      ? `\nChanges made to secrets: ${updated} updated, ${unchanged} unchanged`
      : `\nNo changes, (${unchanged} secret(s) already up to date)`
  );
};

module.exports = updateSecrets;
