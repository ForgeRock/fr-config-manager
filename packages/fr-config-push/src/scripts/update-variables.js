const fs = require("fs");
const path = require("path");
const {
  restPut,
  restGet,
} = require("../../../fr-config-common/src/restClient");
const { replaceEnvSpecificValues } = require("../helpers/config-process");
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

function normalizeVariableExpressionType(variableConfig) {
  return {
    ...variableConfig,
    expressionType: variableConfig.expressionType || "string",
  };
}

function variableMatches(local, remote) {
  return (
    !!local &&
    !!remote &&
    local.expressionType === remote.expressionType &&
    (local.description || "") === (remote.description || "") &&
    local.valueBase64 === remote.valueBase64
  );
}

async function fetchRemoteVariables(tenantBaseUrl, token) {
  const response = await restGet(
    `${tenantBaseUrl}/environment/variables`,
    null,
    token,
    "protocol=1.0,resource=1.0"
  );
  const map = new Map();
  for (const variable of response.data.result) {
    map.set(variable._id, variable);
  }
  return map;
}

const updateVariables = async (argv, token) => {
  const { TENANT_BASE_URL, CONFIG_DIR, ESV_PUSH_CONCURRENCY } = process.env;

  const requestedVariableName = argv[OPTION.NAME];
  const force = !!argv[OPTION.FORCE];
  const concurrency = getConcurrency(ESV_PUSH_CONCURRENCY);

  console.log(
    requestedVariableName
      ? `Updating variable ${requestedVariableName}`
      : "Updating variables"
  );

  const dir = path.join(CONFIG_DIR, "esvs/variables");
  if (!fs.existsSync(dir)) {
    console.log("Warning: No variables defined");
    return;
  }

  // Resolve env-specific placeholders only after filtering by --name. Resolving
  // first would call process.exit(1) for any unrelated file with an unset env
  // var (see helpers/config-process.js), breaking targeted pushes.
  const localVariables = fs
    .readdirSync(dir)
    .filter((name) => path.extname(name) === ".json")
    .map((name) => fs.readFileSync(path.join(dir, name), "utf8"))
    .filter((raw) => {
      if (!requestedVariableName) {
        return true;
      }
      return JSON.parse(raw)._id === requestedVariableName;
    })
    .map((raw) =>
      normalizeVariableExpressionType(
        JSON.parse(replaceEnvSpecificValues(raw, true))
      )
    );

  if (localVariables.length === 0) {
    console.log("No matching variables found to update");
    return;
  }

  let remoteVariables = new Map();
  if (!force) {
    try {
      remoteVariables = await fetchRemoteVariables(TENANT_BASE_URL, token);
    } catch (error) {
      console.error(
        `Failed to pre-fetch variables, falling back to per-variable PUT: ${error.message}.`
      );
    }
  }

  const errors = [];
  let updated = 0;
  let unchanged = 0;

  await parallelMap(localVariables, concurrency, async (variable) => {
    const paddedName = variable._id.padEnd(30);
    const remote = remoteVariables.get(variable._id);

    if (!force && variableMatches(variable, remote)) {
      const status = remote.loaded ? "unchanged" : "pending restart";
      console.log(`Variable ${paddedName} ${status}`);
      unchanged++;
      return;
    }

    try {
      const response = await restPut(
        `${TENANT_BASE_URL}/environment/variables/${variable._id}`,
        variable,
        token,
        "protocol=1.0,resource=1.0"
      );

      if (response.data.loaded) {
        console.log(`Variable ${paddedName} unchanged`);
        unchanged++;
      } else {
        console.log(`Variable ${paddedName} updated`);
        updated++;
      }
    } catch (error) {
      errors.push({ id: variable._id, error: error.message });
      console.error(`Variable ${paddedName} update failed: ${error.message}`);
    }
  });

  if (errors.length > 0) {
    console.error(`\n${errors.length} variable(s) failed to update:`);
    errors.forEach(({ id, error }) => {
      console.error(`- ${id}: ${error}`);
    });
    process.exit(1);
  }

  console.log(
    updated > 0
      ? `\nChanges made to variables: ${updated} updated, ${unchanged} unchanged`
      : `\nNo changes, (${unchanged} variable(s) already up to date)`
  );
};

module.exports = updateVariables;
