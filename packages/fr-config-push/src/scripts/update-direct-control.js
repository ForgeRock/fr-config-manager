const { restGet, restPut } = require("../../../fr-config-common/src/restClient.js");

const BASE_PATH = "/environment/direct-configuration/session";

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

async function applySession(tenantUrl, token) {
  const url = `${tenantUrl}${BASE_PATH}/apply`;
  const response = await restPut(url, null, token);
  printResponse(response);
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
