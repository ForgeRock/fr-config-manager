const mockGetSuperadminCreds = jest.fn();
const mockRestForm = jest.fn();
const mockImportJWK = jest.fn();
const mockImportPKCS8 = jest.fn();
const mockSetProtectedHeader = jest.fn();
const mockSign = jest.fn();
const mockV4 = jest.fn(() => "test-uuid");
const mockReadFileSync = jest.fn();

jest.mock("fs", () => ({
  readFileSync: mockReadFileSync,
}));

jest.mock("../src/authenticate-platform", () => ({
  getSuperadminCreds: mockGetSuperadminCreds,
}));

jest.mock("../src/restClient", () => ({
  restForm: mockRestForm,
}));

jest.mock("jose", () => ({
  importJWK: mockImportJWK,
  importPKCS8: mockImportPKCS8,
  SignJWT: jest.fn(() => ({
    setProtectedHeader: mockSetProtectedHeader.mockReturnThis(),
    sign: mockSign,
  })),
}));

jest.mock("uuid", () => ({
  v4: mockV4,
}));

jest.mock("../src/constants", () => ({
  PrivateKeyFormat: { JWK: "JWK", PEM: "PEM" },
  ACCESS_TOKEN_ENV_VAR: "FCM_ACCESS_TOKEN",
}));

function loadAuthenticate() {
  return require("../src/authenticate");
}

const REQUIRED_CLOUD_ENV = {
  DEPLOYMENT_TYPE: "CLOUD",
  TENANT_BASE_URL: "https://tenant.example.com",
  SERVICE_ACCOUNT_CLIENT_ID: "my-client-id",
  SERVICE_ACCOUNT_ID: "my-service-account-id",
  SERVICE_ACCOUNT_KEY: JSON.stringify({ kty: "RSA", kid: "key1" }),
  SERVICE_ACCOUNT_SCOPE: "fr:idm:*",
  REALMS: "alpha",
};

const REQUIRED_PLATFORM_ENV = {
  DEPLOYMENT_TYPE: "PLATFORM",
  TENANT_BASE_URL: "https://tenant.example.com",
  SUPERADMIN_USERNAME: "admin",
  SUPERADMIN_PASSWORD: "password",
  SUPERADMIN_OAUTH2_CLIENT_ID: "client-id",
  SUPERADMIN_OAUTH2_REDIRECT_URI: "https://tenant.example.com/callback",
  SUPERADMIN_OAUTH2_SCOPE: "openid",
  REALMS: "alpha",
};

const REQUIRED_AM_ENV = {
  DEPLOYMENT_TYPE: "AM",
  TENANT_BASE_URL: "https://tenant.example.com",
  SUPERADMIN_USERNAME: "admin",
  SUPERADMIN_PASSWORD: "password",
  REALMS: "alpha",
};

function setEnv(vars) {
  for (const [key, value] of Object.entries(vars)) {
    process.env[key] = value;
  }
}

function clearEnv(vars) {
  for (const key of Object.keys(vars)) {
    delete process.env[key];
  }
}

describe("getToken - CLOUD deployment", () => {
  let exitSpy;
  let errorSpy;

  beforeEach(() => {
    jest.resetModules();
    setEnv(REQUIRED_CLOUD_ENV);
    exitSpy = jest.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockImportJWK.mockResolvedValue("mock-key");
    mockSign.mockResolvedValue("mock-jwt");
    mockRestForm.mockResolvedValue({ data: { access_token: "cloud-token" } });
  });

  afterEach(() => {
    clearEnv(REQUIRED_CLOUD_ENV);
    delete process.env.FCM_ACCESS_TOKEN;
    delete process.env.SERVICE_ACCOUNT_KEY_PATH;
    exitSpy.mockRestore();
    errorSpy.mockRestore();
    jest.clearAllMocks();
  });

  test("Loads SERVICE_ACCOUNT_KEY in JWK format", async () => {
    const { getToken } = loadAuthenticate();
    const jose = require("jose");
    const { restForm } = require("../src/restClient");

    const token = await getToken();

    expect(jose.importJWK).toHaveBeenCalledWith(
      JSON.parse(REQUIRED_CLOUD_ENV.SERVICE_ACCOUNT_KEY),
      "RS256"
    );
    expect(restForm).toHaveBeenCalledWith(
      `${REQUIRED_CLOUD_ENV.TENANT_BASE_URL}/am/oauth2/access_token`,
      expect.objectContaining({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        client_id: REQUIRED_CLOUD_ENV.SERVICE_ACCOUNT_CLIENT_ID,
        scope: REQUIRED_CLOUD_ENV.SERVICE_ACCOUNT_SCOPE,
        assertion: "mock-jwt",
      })
    );
    expect(token).toBe("cloud-token");
  });

  test("Loads SERVICE_ACCOUNT_KEY in PEM format", async () => {
    process.env.SERVICE_ACCOUNT_KEY =
      "-----BEGIN RSA PRIVATE KEY-----\nfakekey\n-----END RSA PRIVATE KEY-----";
    mockImportPKCS8.mockResolvedValue("mock-pem-key");

    const { getToken } = loadAuthenticate();
    const jose = require("jose");

    await getToken();

    expect(jose.importPKCS8).toHaveBeenCalledWith(process.env.SERVICE_ACCOUNT_KEY, "RS256");
  });

  test("returns token from FCM_ACCESS_TOKEN env var without making network call", async () => {
    process.env.FCM_ACCESS_TOKEN = "env-access-token";
    const { getToken } = loadAuthenticate();
    const { restForm } = require("../src/restClient");

    const token = await getToken();

    expect(token).toBe("env-access-token");
    expect(restForm).not.toHaveBeenCalled();
  });

  test("uses tenantUrlOverride when provided", async () => {
    const { getToken } = loadAuthenticate();
    const { restForm } = require("../src/restClient");

    await getToken("https://override.example.com");

    expect(restForm).toHaveBeenCalledWith(
      "https://override.example.com/am/oauth2/access_token",
      expect.anything()
    );
  });

  test("uses clientConfigOverride when provided", async () => {
    const override = {
      clientId: "override-client",
      jwtIssuer: "override-issuer",
      privateKey: JSON.stringify({ kty: "RSA", kid: "override" }),
      scope: "override:scope",
    };

    const { getToken } = loadAuthenticate();
    const { restForm } = require("../src/restClient");

    await getToken(null, override);

    expect(restForm).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        client_id: "override-client",
        scope: "override:scope",
      })
    );
  });

  test("calls process.exit when a required env var is missing", async () => {
    delete process.env.SERVICE_ACCOUNT_CLIENT_ID;
    const { getToken } = loadAuthenticate();

    await expect(getToken()).rejects.toThrow("process.exit called");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  test("calls process.exit when private key is missing from clientConfig", async () => {
    process.env.SERVICE_ACCOUNT_KEY = "";
    const { getToken } = loadAuthenticate();

    await expect(getToken()).rejects.toThrow("process.exit called");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  test("calls process.exit on restForm error", async () => {
    mockRestForm.mockRejectedValue(new Error("network error"));
    const { getToken } = loadAuthenticate();

    await expect(getToken()).rejects.toThrow("process.exit called");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  test("loads JWK key from SERVICE_ACCOUNT_KEY_PATH when set", async () => {
    const keyFromFile = JSON.stringify({ kty: "RSA", kid: "file-key" });
    process.env.SERVICE_ACCOUNT_KEY_PATH = "/path/to/key.jwk";
    mockReadFileSync.mockReturnValue(keyFromFile);

    const { getToken } = loadAuthenticate();
    const jose = require("jose");
    const fs = require("fs");

    await getToken();

    expect(fs.readFileSync).toHaveBeenCalledWith("/path/to/key.jwk", "utf8");
    expect(jose.importJWK).toHaveBeenCalledWith(JSON.parse(keyFromFile), "RS256");
  });

  test("SERVICE_ACCOUNT_KEY_PATH takes precedence over SERVICE_ACCOUNT_KEY", async () => {
    const keyFromFile = JSON.stringify({ kty: "RSA", kid: "file-key" });
    process.env.SERVICE_ACCOUNT_KEY_PATH = "/path/to/key.jwk";
    process.env.SERVICE_ACCOUNT_KEY = JSON.stringify({ kty: "RSA", kid: "env-key" });
    mockReadFileSync.mockReturnValue(keyFromFile);

    const { getToken } = loadAuthenticate();
    const jose = require("jose");

    await getToken();

    expect(jose.importJWK).toHaveBeenCalledWith(JSON.parse(keyFromFile), "RS256");
    expect(jose.importJWK).not.toHaveBeenCalledWith(
      JSON.parse(process.env.SERVICE_ACCOUNT_KEY),
      "RS256"
    );
  });

  test("calls process.exit when neither SERVICE_ACCOUNT_KEY nor SERVICE_ACCOUNT_KEY_PATH is set", async () => {
    delete process.env.SERVICE_ACCOUNT_KEY;
    const { getToken } = loadAuthenticate();

    await expect(getToken()).rejects.toThrow("process.exit called");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});

describe("getToken - PLATFORM deployment", () => {
  let exitSpy;
  let errorSpy;

  beforeEach(() => {
    jest.resetModules();
    setEnv(REQUIRED_PLATFORM_ENV);
    exitSpy = jest.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockGetSuperadminCreds.mockResolvedValue("platform-token");
  });

  afterEach(() => {
    clearEnv(REQUIRED_PLATFORM_ENV);
    exitSpy.mockRestore();
    errorSpy.mockRestore();
    jest.clearAllMocks();
  });

  test("delegates to getSuperadminCreds with platform flag true", async () => {
    const { getToken } = loadAuthenticate();
    const { getSuperadminCreds } = require("../src/authenticate-platform");

    const token = await getToken();

    expect(getSuperadminCreds).toHaveBeenCalledWith(
      REQUIRED_PLATFORM_ENV.TENANT_BASE_URL,
      true,
      expect.objectContaining({
        username: REQUIRED_PLATFORM_ENV.SUPERADMIN_USERNAME,
        password: REQUIRED_PLATFORM_ENV.SUPERADMIN_PASSWORD,
        clientId: REQUIRED_PLATFORM_ENV.SUPERADMIN_OAUTH2_CLIENT_ID,
        redirectUri: REQUIRED_PLATFORM_ENV.SUPERADMIN_OAUTH2_REDIRECT_URI,
        scope: REQUIRED_PLATFORM_ENV.SUPERADMIN_OAUTH2_SCOPE,
      })
    );
    expect(token).toBe("platform-token");
  });

  test("calls process.exit when a required env var is missing", async () => {
    delete process.env.SUPERADMIN_USERNAME;
    const { getToken } = loadAuthenticate();

    await expect(getToken()).rejects.toThrow("process.exit called");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});

describe("getToken - AM deployment", () => {
  let exitSpy;
  let errorSpy;

  beforeEach(() => {
    jest.resetModules();
    setEnv(REQUIRED_AM_ENV);
    exitSpy = jest.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockGetSuperadminCreds.mockResolvedValue("am-token");
  });

  afterEach(() => {
    clearEnv(REQUIRED_AM_ENV);
    exitSpy.mockRestore();
    errorSpy.mockRestore();
    jest.clearAllMocks();
  });

  test("delegates to getSuperadminCreds with platform flag false", async () => {
    const { getToken } = loadAuthenticate();
    const { getSuperadminCreds } = require("../src/authenticate-platform");

    const token = await getToken();

    expect(getSuperadminCreds).toHaveBeenCalledWith(
      REQUIRED_AM_ENV.TENANT_BASE_URL,
      false,
      expect.objectContaining({
        username: REQUIRED_AM_ENV.SUPERADMIN_USERNAME,
        password: REQUIRED_AM_ENV.SUPERADMIN_PASSWORD,
      })
    );
    expect(token).toBe("am-token");
  });

  test("calls process.exit when a required env var is missing", async () => {
    delete process.env.SUPERADMIN_PASSWORD;
    const { getToken } = loadAuthenticate();

    await expect(getToken()).rejects.toThrow("process.exit called");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
