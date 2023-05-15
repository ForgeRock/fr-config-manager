const fetch = require("node-fetch");

const DEFAULT_API_VERSION = "protocol=2.1,resource=1.0";

const fidcPost = async (requestUrl, body, token, apiVersion = DEFAULT_API_VERSION) => {
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "Accept-API-Version": apiVersion,
  };

  const requestOptions = {
    method: "post",
    body: JSON.stringify(body),
    headers,
  };

  const response = await fetch(requestUrl, requestOptions);

  if (response.status > 299) {
    console.log(
      `POST Error ${response.status}: ${response.statusText} - ${requestUrl}`
    );
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  return await response.json();
};

module.exports = fidcPost;
