const axios = require("axios");
const { HttpsProxyAgent } = require("https-proxy-agent");
const qs = require("qs");
const REQUEST_TYPE = {
  GET: "get",
  POST: "post",
  PUT: "put",
  FORM: "form",
  DELETE: "delete",
};
const { URL } = require("url");
const path = require("path");

async function httpRequest(
  requestUrl,
  requestParameters,
  requestType,
  body,
  token,
  apiVersion,
  ignoreNotFound = false,
  ifMatch = null,
  ifNoneMatch = null
) {
  let request = null;

  switch (requestType) {
    case REQUEST_TYPE.FORM:
      request = {
        method: "post",
        url: requestUrl,
        data: qs.stringify(body),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      };
      break;

    case REQUEST_TYPE.POST:
      request = {
        method: "post",
        url: requestUrl,
        headers: {
          "Content-Type": "application/json",
        },
      };
      if (body) {
        request.data = JSON.stringify(body);
      }
      break;

    case REQUEST_TYPE.PUT:
      let headers = {
        "Content-Type": "application/json",
      };
      if (ifMatch) {
        headers["If-Match"] = ifMatch;
      }
      if (ifNoneMatch) {
        headers["If-None-Match"] = ifMatch;
      }
      request = {
        method: "put",
        url: requestUrl,
        data: JSON.stringify(body),
        headers: headers,
      };
      break;

    case REQUEST_TYPE.GET:
      request = {
        method: "get",
        url: requestUrl,
        headers: {},
      };
      break;

    case REQUEST_TYPE.DELETE:
      request = {
        method: "delete",
        url: requestUrl,
        headers: {},
      };
      break;

    default:
      console.error("Unrecognised request type", requestType);
      process.exit(1);
  }

  if (token) {
    request.headers.Authorization = `Bearer ${token}`;
  }

  if (apiVersion) {
    request.headers["Accept-API-Version"] = apiVersion;
  }

  if (requestParameters) {
    request.params = requestParameters;
  }

  const proxyUrl = process.env.HTTP_PROXY_SERVER;

  if (proxyUrl) {
    request.httpsAgent = new HttpsProxyAgent(proxyUrl);
  }

  const response = await axios(request).catch(function (error) {
    if (error.response && error.response.status === 404 && ignoreNotFound) {
      return null;
    } else {
      console.error(`Exception processing request to ${requestUrl}`);
      console.error(error.response?.data);
      console.error(error.toJSON());
      process.exit(1);
    }
  });

  if (process.argv.includes("--debug") || process.argv.includes("-d")) {
    console.log(
      "============================== >> DEBUG >> =============================="
    );
    console.log("Request:");
    console.log(JSON.stringify(response.config, null, 2));
    console.log("Response:");
    console.log(JSON.stringify(response.data, null, 2));
    console.log(
      "============================== << DEBUG << =============================="
    );
  }

  return response;
}

function restGet(
  requestUrl,
  requestParameters,
  token,
  apiVersion,
  ignoreNotFound = false
) {
  return httpRequest(
    requestUrl,
    requestParameters,
    REQUEST_TYPE.GET,
    null,
    token,
    apiVersion,
    ignoreNotFound
  );
}

function restForm(requestUrl, formData, token) {
  return httpRequest(requestUrl, null, REQUEST_TYPE.FORM, formData, token);
}

function restPost(requestUrl, requestParameters, body, token, apiVersion) {
  return httpRequest(
    requestUrl,
    requestParameters,
    REQUEST_TYPE.POST,
    body,
    token,
    apiVersion
  );
}

function restPut(
  requestUrl,
  body,
  token,
  apiVersion,
  ignoreNotFound = false,
  ifMatch = null,
  ifNoneMatch = null
) {
  return httpRequest(
    requestUrl,
    null,
    REQUEST_TYPE.PUT,
    body,
    token,
    apiVersion,
    ignoreNotFound,
    ifMatch,
    ifNoneMatch
  );
}

function restDelete(requestUrl, token, apiVersion) {
  return httpRequest(
    requestUrl,
    null,
    REQUEST_TYPE.DELETE,
    null,
    token,
    apiVersion
  );
}

async function restUpsert(requestUrl, body, token, apiVersion) {
  try {
    var existingEntry = await restGet(
      requestUrl,
      null,
      token,
      apiVersion,
      true
    );
    if (existingEntry) {
      return await restPut(requestUrl, body, token, apiVersion, true, "*");
    }

    return await restPut(requestUrl, body, token, apiVersion, true, null, "*");
  } catch (e) {
    logRestError(e);
    process.exit(1);
  }
}

function logRestError(error) {
  console.error("Exception:", error.name);
  if (error.name === "AxiosError") {
    console.error("HTTP error", error.message);
    console.error("URL: ", error.response?.config?.url);
    console.error("Response:", error.response?.data);
  } else {
    console.error(error.message);
  }
}

module.exports.restGet = restGet;
module.exports.restForm = restForm;
module.exports.restPost = restPost;
module.exports.restPut = restPut;
module.exports.restUpsert = restUpsert;
module.exports.restDelete = restDelete;
module.exports.logRestError = logRestError;
