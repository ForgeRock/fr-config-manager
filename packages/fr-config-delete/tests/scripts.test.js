const {
  deleteScripts,
  deleteScriptById,
  deleteScriptByName,
} = require("../src/scripts/scripts");
const {
  restGet,
  restDelete,
} = require("../../fr-config-common/src/restClient");

jest.mock("../../fr-config-common/src/restClient");

describe("scripts.js", () => {
  const tenantUrl = "https://example.com";
  const realm = "alpha";
  const token = "fake-token";
  const dryRun = true;

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("deleteScriptById", () => {
    it("should log dry run message when dryRun is true", async () => {
      console.log = jest.fn();
      await deleteScriptById(tenantUrl, realm, "123", token, true);
      expect(console.log).toHaveBeenCalledWith(
        "Dry run: Deleting script with ID 123"
      );
    });

    it("should call restDelete when dryRun is false and log success", async () => {
      restDelete.mockResolvedValue({ status: 204 });
      console.log = jest.fn();
      await deleteScriptById(tenantUrl, realm, "123", token, false);
      expect(restDelete).toHaveBeenCalledWith(
        `${tenantUrl}/am/json/${realm}/scripts/123`,
        token,
        "protocol=2.1,resource=1.0"
      );
      expect(console.log).toHaveBeenCalledWith("Script with ID 123 deleted.");
    });

    it("should throw error if deletion fails", async () => {
      restDelete.mockResolvedValue({ status: 500, data: "Error" });
      await expect(
        deleteScriptById(tenantUrl, realm, "123", token, false)
      ).rejects.toThrow("Error deleting script: Error");
    });
  });

  describe("deleteScriptByName", () => {
    it("should fetch script by name and log dry run message", async () => {
      restGet.mockResolvedValue({
        status: 200,
        data: { result: [{ _id: "123", name: "test-script" }] },
      });
      console.log = jest.fn();
      await deleteScriptByName(tenantUrl, realm, "test-script", token, true);
      expect(console.log).toHaveBeenCalledWith(
        "Dry run: Deleting script with ID 123"
      );
    });

    it("should throw error if no script found", async () => {
      restGet.mockResolvedValue({ status: 200, data: { result: [] } });
      await expect(
        deleteScriptByName(tenantUrl, realm, "nonexistent", token, false)
      ).rejects.toThrow("No script found with the name: nonexistent");
    });

    it("should throw error if multiple scripts found", async () => {
      restGet.mockResolvedValue({
        status: 200,
        data: { result: [{ _id: "123" }, { _id: "456" }] },
      });
      await expect(
        deleteScriptByName(tenantUrl, realm, "duplicate", token, false)
      ).rejects.toThrow(
        "Error: multiple scripts found with the name: duplicate"
      );
    });

    it("should throw error if fetch fails", async () => {
      restGet.mockRejectedValue(new Error("network error"));
      await expect(
        deleteScriptByName(tenantUrl, realm, "test", token, false)
      ).rejects.toThrow("Error fetching script: Error: network error");
    });

    it("should log success if not dryRun", async () => {
      restGet.mockResolvedValue({
        status: 200,
        data: { result: [{ _id: "123", name: "test-script" }] },
      });
      restDelete.mockResolvedValue({ status: 204 });
      console.log = jest.fn();
      await deleteScriptByName(tenantUrl, realm, "test-script", token, false);
      expect(console.log).toHaveBeenCalledWith("Script test-script deleted.");
    });
  });

  describe("deleteScripts", () => {
    it("should throw error if no realms", async () => {
      await expect(
        deleteScripts(tenantUrl, [], '["prefix"]', null, token, true)
      ).rejects.toThrow("Error: No realms found");
    });

    it("should throw error if name and multiple realms", async () => {
      await expect(
        deleteScripts(tenantUrl, ["a", "b"], '["prefix"]', "name", token, true)
      ).rejects.toThrow(
        "Error: Cannot delete script by name when multiple realms are provided"
      );
    });

    it("should throw error if prefixes is invalid JSON", async () => {
      await expect(
        deleteScripts(tenantUrl, [realm], "[", null, token, true)
      ).rejects.toThrow("Error: script prefixes must be valid JSON array");
    });

    it("should process scripts by prefixes", async () => {
      restGet.mockResolvedValue({
        status: 200,
        data: {
          result: [{ _id: "123", name: "test-script", language: "JAVASCRIPT" }],
        },
      });
      console.log = jest.fn();
      await deleteScripts(tenantUrl, [realm], '["test"]', null, token, true);
      expect(console.log).toHaveBeenCalledWith(
        "Dry run: Deleting script test-script (123)"
      );
    });
  });
});
