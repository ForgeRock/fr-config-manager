const fs = require("fs");
const path = require("path");
const {
  restGet,
  restPost,
  restPut,
} = require("../../fr-config-common/src/restClient");
const { replaceEnvSpecificValues } = require("../src/helpers/config-process");
const {
  getEntity,
  handleHostedEntity,
  handleRemoteEntity,
  updateHostedEntity,
  createHostedEntity,
  importRemoteEntity,
} = require("../src/scripts/update-saml");

jest.mock("fs");
jest.mock("path");
jest.mock("../../fr-config-common/src/restClient");
jest.mock("../src/helpers/config-process");

describe("update-saml.js", () => {
  const amSamlBaseUrl = "http://example.com/saml";
  const token = "test-token";
  const entityId = "test-entity-id";
  const samlObject = {
    config: {
      entityId: entityId,
      _id: "test-id",
    },
    metadata: "<xml>metadata</xml>",
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getEntity", () => {
    test("should return entity data", async () => {
      const responseData = { data: { resultCount: 1 } };
      restGet.mockResolvedValue(responseData);

      const result = await getEntity(amSamlBaseUrl, entityId, token);
      expect(result).toEqual(responseData.data);
      expect(restGet).toHaveBeenCalledWith(
        `${amSamlBaseUrl}?_queryFilter=entityId%20eq%20'${entityId}'`,
        null,
        token
      );
    });
  });

  describe("handleHostedEntity", () => {
    test("should update existing hosted entity", async () => {
      const responseData = { data: { resultCount: 1 } };
      restGet.mockResolvedValue(responseData);

      await handleHostedEntity(samlObject, amSamlBaseUrl, token);
      expect(restPut).toHaveBeenCalledWith(
        `${amSamlBaseUrl}/hosted/${samlObject.config._id}`,
        samlObject.config,
        token,
        "protocol=1.0,resource=1.0"
      );
    });

    test("should create new hosted entity", async () => {
      const responseData = { data: { resultCount: 0 } };
      restGet.mockResolvedValue(responseData);

      await handleHostedEntity(samlObject, amSamlBaseUrl, token);
      expect(restPost).toHaveBeenCalledWith(
        `${amSamlBaseUrl}/hosted?_action=create`,
        null,
        samlObject.config,
        token,
        "protocol=1.0,resource=1.0"
      );
    });

    test("should throw error if multiple entities found", async () => {
      const responseData = { data: { resultCount: 2 } };
      restGet.mockResolvedValue(responseData);

      await expect(
        handleHostedEntity(samlObject, amSamlBaseUrl, token)
      ).rejects.toThrow("Error while looking up hosted entity test-entity-id");
    });
  });

  describe("handleRemoteEntity", () => {
    test("should import metadata if entity does not exist", async () => {
      const responseData = { data: { resultCount: 0 } };
      restGet.mockResolvedValue(responseData);

      await handleRemoteEntity(samlObject, amSamlBaseUrl, token);
      const encodedMetadata = Buffer.from(
        samlObject.metadata,
        "utf-8"
      ).toString("base64url");
      expect(restPost).toHaveBeenCalledWith(
        `${amSamlBaseUrl}/remote?_action=importEntity`,
        null,
        { standardMetadata: encodedMetadata },
        token,
        "protocol=1.0,resource=1.0"
      );

      expect(restPut).toHaveBeenCalledWith(
        `${amSamlBaseUrl}/remote/${samlObject.config._id}`,
        samlObject.config,
        token,
        "protocol=1.0,resource=1.0"
      );
    });

    test("should update existing remote entity", async () => {
      const responseData = { data: { resultCount: 1 } };
      restGet.mockResolvedValue(responseData);

      await handleRemoteEntity(samlObject, amSamlBaseUrl, token);
      expect(restPost).not.toHaveBeenCalled();
      expect(restPut).toHaveBeenCalledWith(
        `${amSamlBaseUrl}/remote/${samlObject.config._id}`,
        samlObject.config,
        token,
        "protocol=1.0,resource=1.0"
      );
    });
  });
});
