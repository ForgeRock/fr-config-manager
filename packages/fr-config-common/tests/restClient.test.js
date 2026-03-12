jest.mock("axios", () => jest.fn());

jest.mock("../src/cli-options", () => ({
  COMMON_OPTIONS: {
    RETRIES: "retries",
    RETRY_INTERVAL: "retryInterval",
  },
  getOption: jest.fn(() => 0),
}));

jest.mock("../src/utils", () => ({
  debugMode: jest.fn(() => false),
  dryRun: jest.fn(() => false),
}));

jest.mock("../src/constants", () => ({
  ADMIN_COOKIE_ENV_VAR: "ADMIN_COOKIE",
}));

jest.mock("../src/cookies", () => ({
  getCookies: jest.fn(() => null),
}));

function loadRestClient() {
  return require("../src/restClient");
}

function loadAxios() {
  return require("axios");
}

describe("getGlobalRequestHeaders", () => {
  let warnSpy;

  beforeEach(() => {
    jest.resetModules();
    delete process.env.CUSTOM_HEADERS;
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    jest.clearAllMocks();
  });

  test("returns null when CUSTOM_HEADERS is not set", () => {
    const { getGlobalRequestHeaders } = loadRestClient();
    expect(getGlobalRequestHeaders()).toBeNull();
  });

  test("parses CUSTOM_HEADERS JSON object and stringifies values", () => {
    const { getGlobalRequestHeaders } = loadRestClient();
    process.env.CUSTOM_HEADERS = JSON.stringify({
      "x-test": "abc",
      "x-num": 123,
      "x-bool": true,
      "x-null": null,
    });

    expect(getGlobalRequestHeaders()).toEqual({
      "x-test": "abc",
      "x-num": "123",
      "x-bool": "true",
    });
  });

  test("returns null and warns once for invalid JSON", () => {
    const { getGlobalRequestHeaders } = loadRestClient();
    process.env.CUSTOM_HEADERS = "not-json";

    expect(getGlobalRequestHeaders()).toBeNull();
    expect(getGlobalRequestHeaders()).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  test("returns null and warns once for non-object JSON", () => {
    const { getGlobalRequestHeaders } = loadRestClient();
    process.env.CUSTOM_HEADERS = JSON.stringify(["x-test"]);

    expect(getGlobalRequestHeaders()).toBeNull();
    expect(getGlobalRequestHeaders()).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });
});

describe("httpRequest custom headers", () => {
  beforeEach(() => {
    jest.resetModules();
    delete process.env.CUSTOM_HEADERS;
    delete process.env.ADMIN_COOKIE;
    jest.clearAllMocks();
  });

  test("adds CUSTOM_HEADERS to all requests", async () => {
    const { restGet } = loadRestClient();
    const axios = loadAxios();
    process.env.CUSTOM_HEADERS = JSON.stringify({
      "x-global-header": "global-value",
    });

    axios.mockResolvedValue({
      status: 200,
      headers: {},
      data: {},
      config: {},
    });

    await restGet("https://example.com/api/resource", null, null, null);

    expect(axios).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          "x-global-header": "global-value",
        }),
      })
    );
  });
});
