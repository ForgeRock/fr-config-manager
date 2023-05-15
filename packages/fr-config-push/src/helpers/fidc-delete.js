const fetch = require("node-fetch");

const DEFAULT_API_VERSION = "protocol=2.1,resource=1.0";

const fidcDelete = async (
  requestUrl,
  token,
  ignoreNotFound = true,
  apiVersion = DEFAULT_API_VERSION
) => {
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "Accept-API-Version": apiVersion,
  };

  const requestOptions = {
    method: "delete",
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
    if (response.ok || (ignoreNotFound && response.status === 404)) {
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
    console.error(`DELETE Error: ${errorBody}`);
  }
  return Promise.resolve();
};

module.exports = fidcDelete;
