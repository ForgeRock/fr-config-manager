const axios = require("axios");
const jose = require("node-jose");
const uuid = require("uuid");
const qs = require("qs");
const constants = require("./constants");
const { restForm } = require("./restClient");

const { PrivateKeyFormat } = constants;

const JWT_VALIDITY_SECONDS = 180;

function getPrivateKeyFormat(privateKey) {
  return privateKey.startsWith("-----BEGIN RSA PRIVATE KEY-----")
    ? PrivateKeyFormat.PEM
    : PrivateKeyFormat.JWK;
}

async function getToken(tenantUrl, clientConfig) {
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
