const fs = require("fs");
const { restGet } = require("../../fr-config-common/src/restClient.js");
const {
  saveJsonToFile,
  escapePlaceholders,
  replaceAllInJson,
  safeFileNameUnderscore,
} = require("../../fr-config-common/src/utils.js");
const {
  exportConfig,
  fetchSamlEntity,
  fetchSamlEntityDetails,
  fetchMetadata,
  mergeConfig,
  createTargetDir,
} = require("../src/scripts/saml");

jest.mock("fs");
jest.mock("../../fr-config-common/src/restClient.js");
jest.mock("../../fr-config-common/src/utils.js");

describe("saml.js", () => {
  const token = "test-token";
  const entityId = "test-entity-id";
  const tenantUrl = "http://example.com";
  const realm = "test-realm";
  const amSamlBaseUrl = `${tenantUrl}/am/json/realms/root/realms/${realm}/realm-config/saml2`;
  const samlEndpoint = `${amSamlBaseUrl}?_queryFilter=entityId%20eq%20'${entityId}'`;
  const samlEntityEndpoint = `${amSamlBaseUrl}/hosted/test-id`;
  const metadataUrl = `${tenantUrl}/am/saml2/jsp/exportmetadata.jsp?entityid=${entityId}&realm=${realm}`;
  const samlObject = {
    config: {
      entityId: entityId,
      _id: "test-id",
      _rev: "test-rev",
    },
    metadata: "<xml>metadata</xml>",
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("fetchSamlEntity", () => {
    test("should return SAML entity data", async () => {
      const responseData = { data: { resultCount: 1 } };
      restGet.mockResolvedValue(responseData);

      const result = await fetchSamlEntity(samlEndpoint, token);
      expect(result).toEqual(responseData.data);
      expect(restGet).toHaveBeenCalledWith(samlEndpoint, null, token);
    });
  });

  describe("fetchSamlEntityDetails", () => {
    test("should return SAML entity details", async () => {
      const responseData = { data: samlObject.config };
      restGet.mockResolvedValue(responseData);

      const result = await fetchSamlEntityDetails(samlEntityEndpoint, token);
      expect(result).toEqual(responseData.data);
      expect(restGet).toHaveBeenCalledWith(samlEntityEndpoint, null, token);
    });
  });

  describe("fetchMetadata", () => {
    test("should return metadata", async () => {
      const responseData = { data: samlObject.metadata };
      restGet.mockResolvedValue(responseData);

      const result = await fetchMetadata(metadataUrl, token);
      expect(result).toEqual(responseData.data);
      expect(restGet).toHaveBeenCalledWith(metadataUrl, null, token);
    });
  });

  describe("mergeConfig", () => {
    test("should merge config with overrides and replacements", () => {
      const config = { key: "value" };
      const overrides = { key: "newValue" };
      const replacements = [
        { search: "newValue", replacement: "replacedValue" },
      ];

      replaceAllInJson.mockImplementation((config, replacements) => {
        return { key: "replacedValue" };
      });

      const result = mergeConfig(config, overrides, replacements);
      expect(result).toEqual({ key: "replacedValue" });
      expect(replaceAllInJson).toHaveBeenCalledWith(
        { key: "newValue" },
        replacements
      );
    });
  });

  describe("createTargetDir", () => {
    test("should create target directory if it does not exist", () => {
      const targetDir = "/path/to/dir";
      fs.existsSync.mockReturnValue(false);

      createTargetDir(targetDir);
      expect(fs.mkdirSync).toHaveBeenCalledWith(targetDir, { recursive: true });
    });

    test("should not create target directory if it exists", () => {
      const targetDir = "/path/to/dir";
      fs.existsSync.mockReturnValue(true);

      createTargetDir(targetDir);
      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });
  });

  describe("exportConfig", () => {
    test("should export SAML config", async () => {
      const exportDir = "/export";
      const samlConfigFile = "/path/to/samlConfig.json";
      const samlEntities = {
        [realm]: {
          samlProviders: [
            {
              entityId: entityId,
              overrides: { key: "overrideValue" },
              replacements: [
                { search: "overrideValue", replacement: "replacedValue" },
              ],
            },
          ],
        },
      };

      const samlQuery = {
        resultCount: 1,
        result: [{ _id: "test-id", location: "hosted" }],
      };
      const config = { entityId: entityId, key: "value" };
      const mergedConfig = { entityId: entityId, key: "replacedValue" };
      const metadata = "<xml>metadata</xml>";
      const samlConfig = { config: mergedConfig, metadata };

      fs.readFileSync.mockReturnValue(JSON.stringify(samlEntities));
      restGet.mockResolvedValueOnce({ data: samlQuery });
      restGet.mockResolvedValueOnce({ data: config });
      restGet.mockResolvedValueOnce({ data: metadata });
      escapePlaceholders.mockReturnValue(config);
      replaceAllInJson.mockReturnValue(mergedConfig);
      safeFileNameUnderscore.mockReturnValue(entityId);

      await exportConfig(exportDir, samlConfigFile, tenantUrl, token);

      expect(fs.readFileSync).toHaveBeenCalledWith(samlConfigFile, "utf8");
      expect(restGet).toHaveBeenCalledWith(samlEndpoint, null, token);
      expect(restGet).toHaveBeenCalledWith(samlEntityEndpoint, null, token);
      expect(restGet).toHaveBeenCalledWith(metadataUrl, null, token);
      expect(escapePlaceholders).toHaveBeenCalledWith(config);
      expect(replaceAllInJson).toHaveBeenCalledWith(
        config,
        samlEntities[realm].samlProviders[0].replacements
      );
      expect(fs.existsSync).toHaveBeenCalledWith(
        `${exportDir}/realms/${realm}/realm-config/saml/hosted`
      );
      expect(saveJsonToFile).toHaveBeenCalledWith(
        samlConfig,
        `${exportDir}/realms/${realm}/realm-config/saml/hosted/${entityId}.json`
      );
    });
  });
});
