const { env } = require("yargs");
const {
  restGet,
  restPost,
} = require("../../../fr-config-common/src/restClient");
const cliUtils = require("../helpers/cli-options");
const { OPTION } = cliUtils;
const POLL_INTERVAL_SECONDS = 10;

async function esvsLoaded(envUrl, token) {
  let response = await restGet(
    `${envUrl}/secrets`,
    null,
    token,
    "protocol=1.0,resource=1.0"
  );

  var secretsChanged = false;

  response.data.result.forEach((secret) => {
    if (secret.loadedVersion !== secret.activeVersion) {
      secretsChanged = true;
    }
  });

  if (secretsChanged) {
    return false;
  }

  response = await restGet(
    `${envUrl}/variables`,
    null,
    token,
    "protocol=1.0,resource=1.0"
  );

  var variablesChanged = false;

  response.data.result.forEach((variable) => {
    if (!variable.loaded) {
      variablesChanged = true;
    }
  });

  if (variablesChanged) {
    return false;
  }

  return true;
}

async function waitForRestart(envUrl, token) {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const startupResponse = await restGet(
    `${envUrl}/startup`,
    null,
    token,
    "protocol=1.0,resource=1.0"
  );

  if (startupResponse.data.restartStatus !== "ready") {
    console.log("Waiting for restart");
    await sleep(POLL_INTERVAL_SECONDS * 1000);
    await waitForRestart(envUrl, token);
  }
}

const restartFidc = async (argv, token) => {
  const { TENANT_BASE_URL } = process.env;

  try {
    const envUrl = `${TENANT_BASE_URL}/environment`;

    const startupResponse = await restGet(
      `${envUrl}/startup`,
      null,
      token,
      "protocol=1.0,resource=1.0"
    );

    const restartStatus = startupResponse.data.restartStatus;
    if (argv[OPTION.STATUS]) {
      console.log(restartStatus);
      return;
    }

    if (restartStatus === "restarting") {
      console.error("Environment already restarting.");
      process.exit(1);
    } else if (argv[OPTION.CHECK] && (await esvsLoaded(envUrl, token))) {
      console.log("All ESVs loaded - not restarting");
    } else {
      await restPost(
        `${envUrl}/startup`,
        { _action: "restart" },
        null,
        token,
        "protocol=1.0,resource=1.0"
      );
      console.log("Environment restart initiated.");

      if (argv[OPTION.WAIT]) {
        await waitForRestart(envUrl, token);
        console.log("Environment restart complete.");
      }
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = restartFidc;
