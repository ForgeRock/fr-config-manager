const constants = require("./constants");
const { restForm, restPlatformAuthenticate, restGet } = require("./restClient");
const uuid = require("uuid");
const { randomBytes, createHash } = require("crypto");
const { setCookies, getCookies } = require("./cookies");

const { PrivateKeyFormat, ACCESS_TOKEN_ENV_VAR } = constants;

function base64UrlEncode(buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function generateCodeVerifier(length = 64) {
  return base64UrlEncode(randomBytes(length)).slice(0, length);
}

function generateCodeChallenge(verifier) {
  return base64UrlEncode(createHash("sha256").update(verifier).digest());
}

async function getSuperadminCreds(platformUrl, getToken, superadminConfig) {
  const cookies = await getSuperadminCookies(platformUrl, superadminConfig);
  if (!cookies) {
    logger.error("Error authenicating superadmin");
    process.exit(1);
  }

  setCookies(cookies);

  if (getToken) {
    return await getSuperadminToken(platformUrl, superadminConfig);
  }
  return null;
}

async function getSuperadminCookies(platformUrl, superadminConfig) {
  const tokenEndpoint = `${platformUrl}/am/oauth2/access_token`;
  const authenticateEndpoint = `${platformUrl}/am/json/authenticate`;

  try {
    const authResponse = await restPlatformAuthenticate(
      authenticateEndpoint,
      superadminConfig.username,
      superadminConfig.password,
      superadminConfig.journey
    );

    let cookies = [];

    authResponse.headers["set-cookie"].forEach((cookie) =>
      cookies.push(cookie.split(";")[0])
    );

    return cookies.length > 0 ? cookies.join(";") : null;
  } catch (err) {
    console.error(
      err.message,
      err.response ? err.response.data : "No response data"
    );
    process.exit(1);
  }
}

async function getSuperadminToken(platformUrl, superadminConfig) {
  const authoriseEndpoint = `${platformUrl}/am/oauth2/authorize`;
  const tokenEndpoint = `${platformUrl}/am/oauth2/access_token`;
  try {
    const verifier = generateCodeVerifier();
    const challenge = generateCodeChallenge(verifier);

    const urlParameters = {
      redirect_uri: superadminConfig.redirectUri,
      client_id: superadminConfig.clientId,
      response_type: "code",
      state: uuid.v4(),
      scope: superadminConfig.scope,
      prompt: "none",
      code_challenge: challenge, // "utM_98ywnbJrVMQu-T1oiU66_d7rFqTgkK8izk3_bSY",
      code_challenge_method: "S256",
    };

    const authzResponse = await restGet(authoriseEndpoint, urlParameters);

    const location = authzResponse.headers.location;
    if (!location) {
      console.error("No location header");
      process.exit(1);
    }

    const params = new URL(location).searchParams;
    const code = params.get("code");
    if (!code) {
      console.error("No authorisation code");
      process.exit(1);
    }

    const formData = {
      grant_type: "authorization_code",
      client_id: superadminConfig.clientId,
      scope: superadminConfig.scope,
      redirect_uri: superadminConfig.redirectUri,
      code: code,
      code_verifier: verifier,
      // "pB23P07c8YX4JwDkrwE5pv0ZEVIs3lzO7CLHXieaZHarwyGAlTlkQMfzOWconpZtF9EEPQ9JgDnnMto1tPhq9z6fyusFmF4zBClylUA4Pn9wH1jT1vjbmrDHCO1ktpjB",
    };

    const response = await restForm(tokenEndpoint, formData);

    return response.data.access_token;
  } catch (err) {
    console.error(
      err.message,
      err.response ? err.response.data : "No response data"
    );
    process.exit(1);
  }
}

module.exports.getSuperadminCreds = getSuperadminCreds;
