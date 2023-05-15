const fetch = require("node-fetch");

const fidcGet = async (requestUrl, token, ignoreNotFound = false) => {
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "Accept-API-Version": "protocol=1.0,resource=1.0",
  };

  const requestOptions = {
    method: "get",
    body: null,
    headers,
  };

  const response = await fetch(requestUrl, requestOptions);

  if (response.status === 404 && ignoreNotFound) {
    return null;
  } else if (response.status !== 200) {
    /*
    console.log(
      `GET Error ${response.status}: ${response.statusText} - ${requestUrl}`
    );
    */
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  return await response.json();
};

module.exports = fidcGet;
