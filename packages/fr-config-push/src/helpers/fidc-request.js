const fetch = require("node-fetch");

const DEFAULT_API_VERSION = "protocol=2.1,resource=1.0";

const fidcRequest = async (
  requestUrl,
  body,
  token,
  apiVersion = DEFAULT_API_VERSION
) => {
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "Accept-API-Version": apiVersion,
  };

  const requestOptions = {
    method: "put",
    body: JSON.stringify(body),
    headers,
  };
  class HTTPResponseError extends Error {
    constructor(response, ...args) {
      super(
        `HTTP Error Response: ${response.status} ${response.statusText}`,
        ...args
      );
      this.response = response;
    }
  }
  const checkStatus = (response) => {
    if (response.ok) {
      // response.status >= 200 && response.status < 300
      return response;
    } else {
      throw new HTTPResponseError(response);
    }
  };
  const response = await fetch(requestUrl, requestOptions);
  try {
    checkStatus(response);
  } catch (error) {
    console.error(error);
    const errorBody = await error.response.text();
    console.error(`PUT Error: ${errorBody}`);
    process.exit(1);
  }
  return Promise.resolve();
};

module.exports = fidcRequest;
