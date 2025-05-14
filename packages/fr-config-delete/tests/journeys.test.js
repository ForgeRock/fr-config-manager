const {
  deleteJourneys,
  processSingleJourney,
} = require("../src/scripts/journeys");
const {
  restGet,
  restDelete,
  restPost,
} = require("../../fr-config-common/src/restClient");

jest.mock("../../fr-config-common/src/restClient");

describe("journeys.js", () => {
  const mockUrl = "https://example.com";
  const mockRealms = ["alpha"];
  const mockToken = "mockAccessToken";
  const mockName = "journey1";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("processSingleJourney", () => {
    it("should process a single journey and delete it", async () => {
      restGet.mockResolvedValueOnce({
        data: {
          _id: "journey1",
          nodes: { node1: { nodeType: "TypeA" } },
        },
      });

      restDelete.mockResolvedValue();

      await processSingleJourney("alpha", "journey1", mockUrl, mockToken);

      expect(restGet).toHaveBeenCalledWith(
        `${mockUrl}/am/json/realms/root/realms/alpha/realm-config/authentication/authenticationtrees/trees/journey1`,
        null,
        mockToken,
        "protocol=2.1,resource=1.0",
        true
      );
      expect(restDelete).toHaveBeenCalled();
    });

    it("should process a single journey with trailing space and delete it", async () => {
      restGet.mockResolvedValueOnce({
        data: {
          _id: "journey1 ",
          nodes: { node1: { nodeType: "TypeA" } },
        },
      });

      restDelete.mockResolvedValue();

      await processSingleJourney("alpha", "journey1 ", mockUrl, mockToken);

      expect(restGet).toHaveBeenCalledWith(
        `${mockUrl}/am/json/realms/root/realms/alpha/realm-config/authentication/authenticationtrees/trees/journey1%20`,
        null,
        mockToken,
        "protocol=2.1,resource=1.0",
        true
      );
      expect(restDelete).toHaveBeenCalled();
    });
    it("should log a message if the journey is not found", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      restGet.mockResolvedValueOnce(null);

      await processSingleJourney("realm1", "nonexistentJourney");

      expect(consoleSpy).toHaveBeenCalledWith(
        "No journey found with name nonexistentJourney"
      );
      consoleSpy.mockRestore();
    });
  });

  describe("deleteJourneys", () => {
    it("should process all journeys in a realm", async () => {
      restGet.mockResolvedValueOnce({
        data: {
          result: [
            { _id: "journey1", nodes: { node1: { nodeType: "TypeA" } } },
          ],
        },
      });

      restDelete.mockResolvedValue();

      await deleteJourneys(
        mockUrl,
        mockRealms,
        null,
        false,
        false,
        false,
        mockToken
      );

      expect(restGet).toHaveBeenCalled();
      expect(restDelete).toHaveBeenCalled();
    });

    it("should process a specific journey by name", async () => {
      restGet.mockResolvedValueOnce({
        data: {
          _id: "journey1",
          nodes: { node1: { nodeType: "TypeA" } },
        },
      });

      restDelete.mockResolvedValue();

      await deleteJourneys(
        mockUrl,
        mockRealms,
        mockName,
        false,
        false,
        false,
        mockToken
      );

      expect(restGet).toHaveBeenCalled();
      expect(restDelete).toHaveBeenCalled();
    });

    it("should process inner journeys when deleteInnerJourneys is true", async () => {
      restGet.mockResolvedValueOnce({
        data: {
          _id: "journey1",
          nodes: {
            node1: { nodeType: "InnerTreeEvaluatorNode" },
          },
        },
      });

      restGet.mockResolvedValueOnce({
        data: {
          tree: "innerJourney",
        },
      });

      restGet.mockResolvedValueOnce({
        data: {
          _id: "innerJourney",
          nodes: {
            node: { nodeType: "TypeB" },
          },
        },
      });

      restDelete.mockResolvedValue();

      await deleteJourneys(
        mockUrl,
        mockRealms,
        mockName,
        true,
        false,
        false,
        mockToken
      );

      expect(restGet).toHaveBeenCalledTimes(3); // Fetch journeys and inner journey
      expect(restDelete).toHaveBeenCalledTimes(4); // Delete both journeys and nodes
    });

    it("should not process inner journeys when deleteInnerJourneys is false", async () => {
      restGet.mockResolvedValueOnce({
        data: {
          _id: "journey1",
          nodes: {
            node1: { nodeType: "InnerTreeEvaluatorNode" },
          },
        },
      });

      restDelete.mockResolvedValue();

      await deleteJourneys(
        mockUrl,
        mockRealms,
        mockName,
        false,
        false,
        false,
        mockToken
      );

      expect(restGet).toHaveBeenCalledTimes(1); // Fetch journeys only
      expect(restDelete).toHaveBeenCalledTimes(2); // Delete only the main journey
    });

    it("should throw an error if delete journey by name is executed with multiple realms", async () => {
      const mockRealms = ["alpha", "beta"];
      const mockName = "journey1";
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      const processExitSpy = jest
        .spyOn(process, "exit")
        .mockImplementation(() => {});

      await deleteJourneys(
        mockUrl,
        mockRealms,
        mockName,
        false,
        false,
        false,
        mockToken
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error: Cannot delete journey by name when multiple realms are provided"
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);

      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
    });
  });
});
