const { restGet, restPut } = require("../../../fr-config-common/src/restClient.js");

const BASE_PATH = "/environment/direct-configuration/session";
const POLL_INTERVAL_SECONDS = 10;
const SESSION_APPLIED_STATUS = "SESSION_APPLIED";

function printResponse(response) {
  if (!response) {
    console.log("No response");
    return;
  }

  if (response.data !== undefined) {
    console.log(JSON.stringify(response.data, null, 2));
    return;
  }

  console.log(JSON.stringify(response, null, 2));
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function initSession(tenantUrl, token) {
  const url = `${tenantUrl}${BASE_PATH}/init`;
  const response = await restPut(url, null, token);
  printResponse(response);
}

async function getSessionState(tenantUrl, token) {
  const url = `${tenantUrl}${BASE_PATH}/state`;
  const response = await restGet(url, null, token);
  printResponse(response);
}

async function applySession(tenantUrl, token, wait = false) {
  const url = `${tenantUrl}${BASE_PATH}/apply`;
  const response = await restPut(url, null, token);
  printResponse(response);

  if (wait) {
    const stateUrl = `${tenantUrl}${BASE_PATH}/state`;
    console.log(`Waiting for status ${SESSION_APPLIED_STATUS}...`);
    while (true) {
      await sleep(POLL_INTERVAL_SECONDS * 1000);
      const stateResponse = await restGet(stateUrl, null, token);
      const status = stateResponse?.data?.status;
      console.log(`Status: ${status}`);
      if (status === SESSION_APPLIED_STATUS) {
        break;
      }
      if (status === "ERROR") {
        console.error("Direct Configuration session encountered an error.");
        process.exit(1);
      }
    }
  }
}

async function abortSession(tenantUrl, token) {
  const url = `${tenantUrl}${BASE_PATH}/abort`;
  const response = await restPut(url, null, token);
  printResponse(response);
}

module.exports = {
  initSession,
  getSessionState,
  applySession,
  abortSession,
};
