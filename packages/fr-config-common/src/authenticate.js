const axios = require("axios");
const jose = require("node-jose");
const uuid = require("uuid");
const qs = require("qs");
const constants = require("./constants");
const { restForm } = require("./restClient");
const { getSuperadminCreds } = require("./authenticate-platform");

const { PrivateKeyFormat, ACCESS_TOKEN_ENV_VAR } = constants;

const JWT_VALIDITY_SECONDS = 180;

function getPrivateKeyFormat(privateKey) {
  return privateKey.startsWith("-----BEGIN RSA PRIVATE KEY-----")
    ? PrivateKeyFormat.PEM
    : PrivateKeyFormat.JWK;
}

function checkConfig(requiredConfig) {
  var valid = true;

  for (const parameter of requiredConfig) {
    if (!process.env[parameter]) {
      console.error("Required config", parameter, "not found");
      process.exit(1);
    }
  }
  return valid;
}

async function getToken(tenantUrlOverride = null, clientConfigOverride = null) {
  switch (process.env.DEPLOYMENT_TYPE) {
    case "PLATFORM":
      checkConfig([
        "TENANT_BASE_URL",
        "SUPERADMIN_USERNAME",
        "SUPERADMIN_PASSWORD",
        "SUPERADMIN_OAUTH2_CLIENT_ID",
        "SUPERADMIN_OAUTH2_REDIRECT_URI",
        "SUPERADMIN_OAUTH2_SCOPE",
        "REALMS",
      ]);

      return await getSuperadminCreds(process.env.TENANT_BASE_URL, true, {
        username: process.env.SUPERADMIN_USERNAME,
        password: process.env.SUPERADMIN_PASSWORD,
        clientId: process.env.SUPERADMIN_OAUTH2_CLIENT_ID,
        redirectUri: process.env.SUPERADMIN_OAUTH2_REDIRECT_URI,
        scope: process.env.SUPERADMIN_OAUTH2_SCOPE,
      });

    case "AM":
      checkConfig([
        "TENANT_BASE_URL",
        "SUPERADMIN_USERNAME",
        "SUPERADMIN_PASSWORD",
        "REALMS",
      ]);
      const superadminConfig = {
        username: process.env.SUPERADMIN_USERNAME,
        password: process.env.SUPERADMIN_PASSWORD,
        clientId: process.env.SUPERADMIN_OAUTH2_CLIENT_ID,
        redirectUri: process.env.SUPERADMIN_OAUTH2_REDIRECT_URI,
        scope: process.env.SUPERADMIN_OAUTH2_SCOPE,
      };
      return await getSuperadminCreds(process.env.TENANT_BASE_URL, false, {
        username: process.env.SUPERADMIN_USERNAME,
        password: process.env.SUPERADMIN_PASSWORD,
      });

    case "CLOUD":
    default:
      checkConfig([
        "TENANT_BASE_URL",
        "SERVICE_ACCOUNT_CLIENT_ID",
        "SERVICE_ACCOUNT_ID",
        "SERVICE_ACCOUNT_KEY",
        "SERVICE_ACCOUNT_SCOPE",
        "REALMS",
      ]);
      const clientConfig = clientConfigOverride || {
        clientId: process.env.SERVICE_ACCOUNT_CLIENT_ID,
        jwtIssuer: process.env.SERVICE_ACCOUNT_ID,
        privateKey: process.env.SERVICE_ACCOUNT_KEY,
        scope: process.env.SERVICE_ACCOUNT_SCOPE,
      };
      return await getServiceAccountToken(
        tenantUrlOverride || process.env.TENANT_BASE_URL,
        clientConfig
      );
  }
}

async function getServiceAccountToken(tenantUrl, clientConfig) {
  const envToken = process.env[ACCESS_TOKEN_ENV_VAR];

  if (envToken) {
    console.log("Using access token from environment");
    return envToken;
  }

  const tokenEndpoint = `${tenantUrl}/am/oauth2/access_token`;
  try {
    const payload = {
      iss: clientConfig.jwtIssuer,
      sub: clientConfig.jwtIssuer,
      aud: tokenEndpoint,
      jti: uuid.v4(),
      exp: Math.floor(new Date().getTime() / 1000) + JWT_VALIDITY_SECONDS,
    };

    var key;

    if (!clientConfig.privateKey) {
      console.error("Private key not defined");
      process.exit(1);
    }

    if (getPrivateKeyFormat(clientConfig.privateKey) === PrivateKeyFormat.JWK) {
      key = await jose.JWK.asKey(JSON.parse(clientConfig.privateKey));
    } else {
      var keystore = jose.JWK.createKeyStore();
      key = await keystore.add(clientConfig.privateKey, "pem");
    }

    const jwt = await jose.JWS.createSign(
      { alg: "RS256", compact: true, fields: {} },
      { key, reference: false }
    )
      .update(JSON.stringify(payload))
      .final();

    const formData = {
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      client_id: clientConfig.clientId,
      scope: clientConfig.scope,
      assertion: jwt,
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

  return null;
}

module.exports.getToken = getToken;
