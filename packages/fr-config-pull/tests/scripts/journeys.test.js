import { afterAll, afterEach, beforeEach, expect, it, vi } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { vol } from "memfs";
import { exportJourneys } from "../../src/scripts/journeys";
import { setTimeout } from "timers/promises";

beforeEach(() => vol.reset());
afterEach(() => vi.resetAllMocks());

// Throw errors instead of logging them and exiting.
vi.mock("console", "error", (message) => {
  throw new Error(message);
});

const server = setupServer();
server.listen({ onUnhandledRequest: "error" });
afterAll(() => server.close());

const loginJourney = {
  _id: "Login",
  nodes: {
    1: {
      _id: "1",
      displayName: "Identify Existing User",
      nodeType: "IdentifyExistingUserNode",
    },
  },
};
const passwordJourney = { ...loginJourney, _id: "Password" };
const identifyNode = { _id: "1", _type: { _id: "IdentifyExistingUserNode" } };

it(
  "creates journey and node files",
  server.boundary(async () => {
    server.use(
      http.get(
        "http://test.org/am/json/realms/root/realms/alpha/realm-config/authentication/authenticationtrees/trees",
        () => HttpResponse.json({ result: [loginJourney] })
      ),
      http.get(
        "http://test.org/am/json/realms/root/realms/alpha/realm-config/authentication/authenticationtrees/nodes/IdentifyExistingUserNode",
        () => HttpResponse.json({ result: [identifyNode] })
      )
    );

    await exportJourneys("/", "http://test.org", ["alpha"]);
    await setTimeout();

    expect(vol.toJSON()).toEqual({
      "/alpha/journeys/Login/Login.json": JSON.stringify(loginJourney, null, 2),
      "/alpha/journeys/Login/nodes/Identify Existing User - 1.json":
        JSON.stringify(identifyNode, null, 2),
    });
  })
);

it(
  "exports a single journey",
  server.boundary(async () => {
    server.use(
      http.get(
        "http://test.org/am/json/realms/root/realms/alpha/realm-config/authentication/authenticationtrees/trees",
        () => HttpResponse.json({ result: [loginJourney, passwordJourney] })
      ),
      http.get(
        "http://test.org/am/json/realms/root/realms/alpha/realm-config/authentication/authenticationtrees/nodes/IdentifyExistingUserNode",
        () => HttpResponse.json({ result: [identifyNode] })
      )
    );

    await exportJourneys("/", "http://test.org", ["alpha"], "Login");
    await setTimeout();

    expect(vol.toJSON()).toEqual({
      "/alpha/journeys/Login/Login.json": JSON.stringify(loginJourney, null, 2),
      "/alpha/journeys/Login/nodes/Identify Existing User - 1.json":
        JSON.stringify(identifyNode, null, 2),
    });
  })
);

it(
  "exports page nodes with children",
  server.boundary(async () => {
    const journey = {
      _id: "Login",
      nodes: { 3: { _id: "3", displayName: "My Page", nodeType: "PageNode" } },
    };
    const pageNode = {
      _id: "3",
      _type: { _id: "PageNode" },
      nodes: [loginJourney.nodes["1"]],
    };
    server.use(
      http.get(
        "http://test.org/am/json/realms/root/realms/alpha/realm-config/authentication/authenticationtrees/trees",
        () => HttpResponse.json({ result: [journey] })
      ),
      http.get(
        "http://test.org/am/json/realms/root/realms/alpha/realm-config/authentication/authenticationtrees/nodes/PageNode",
        () => HttpResponse.json({ result: [pageNode] })
      ),
      http.get(
        "http://test.org/am/json/realms/root/realms/alpha/realm-config/authentication/authenticationtrees/nodes/IdentifyExistingUserNode",
        () => HttpResponse.json({ result: [identifyNode] })
      )
    );

    await exportJourneys("/", "http://test.org", ["alpha"]);
    await setTimeout();

    expect(vol.toJSON()).toEqual({
      "/alpha/journeys/Login/Login.json": JSON.stringify(journey, null, 2),
      "/alpha/journeys/Login/nodes/My Page - 3.json": JSON.stringify(
        pageNode,
        null,
        2
      ),
      "/alpha/journeys/Login/nodes/My Page - 3/Identify Existing User - 1.json":
        JSON.stringify(identifyNode, null, 2),
    });
  })
);

it(
  "exports dependent journeys",
  server.boundary(async () => {
    const loginJourney = {
      _id: "Login",
      nodes: {
        2: {
          displayName: "Inner Tree Evaluator",
          nodeType: "InnerTreeEvaluatorNode",
        },
      },
    };

    const iteNode = {
      _id: "2",
      _type: { _id: "InnerTreeEvaluatorNode", name: "Inner Tree Evaluator" },
      tree: "Password",
    };

    server.use(
      http.get(
        "http://test.org/am/json/realms/root/realms/alpha/realm-config/authentication/authenticationtrees/trees",
        () => HttpResponse.json({ result: [passwordJourney, loginJourney] })
      ),
      http.get(
        "http://test.org/am/json/realms/root/realms/alpha/realm-config/authentication/authenticationtrees/nodes/InnerTreeEvaluatorNode",
        () => HttpResponse.json({ result: [iteNode] })
      ),
      http.get(
        "http://test.org/am/json/realms/root/realms/alpha/realm-config/authentication/authenticationtrees/nodes/IdentifyExistingUserNode",
        () => HttpResponse.json({ result: [identifyNode] })
      )
    );

    await exportJourneys("/", "http://test.org", ["alpha"], "Login", true);
    await setTimeout();

    expect(vol.toJSON()).toEqual({
      "/alpha/journeys/Login/Login.json": JSON.stringify(loginJourney, null, 2),
      "/alpha/journeys/Login/nodes/Inner Tree Evaluator - 2.json":
        JSON.stringify(iteNode, null, 2),
      "/alpha/journeys/Password/Password.json": JSON.stringify(
        passwordJourney,
        null,
        2
      ),
      "/alpha/journeys/Password/nodes/Identify Existing User - 1.json":
        JSON.stringify(identifyNode, null, 2),
    });
  })
);

it(
  "exports dependent scripts",
  server.boundary(async () => {
    const journey = {
      _id: "Login",
      nodes: {
        5: { _id: "5", displayName: "Frob", nodeType: "ScriptedDecisionNode" },
      },
    };
    const scriptNode = {
      _id: "5",
      _type: { _id: "ScriptedDecisionNode", name: "Call Frob" },
      script: "555",
    };
    const scriptConfig = {
      _id: "555",
      context: "AUTHENTICATION_TREE_DECISION_NODE",
      name: "Frob",
      script: Buffer.from("log('Hi')").toString("base64"),
    };
    server.use(
      http.get(
        "http://test.org/am/json/realms/root/realms/alpha/realm-config/authentication/authenticationtrees/trees",
        () => HttpResponse.json({ result: [journey] })
      ),
      http.get(
        "http://test.org/am/json/realms/root/realms/alpha/realm-config/authentication/authenticationtrees/nodes/ScriptedDecisionNode",
        () => HttpResponse.json({ result: [scriptNode] })
      ),
      http.get("http://test.org/am/json/alpha/scripts/555", () =>
        HttpResponse.json(scriptConfig)
      )
    );

    await exportJourneys("/", "http://test.org", ["alpha"], null, true);
    await setTimeout();

    expect(vol.toJSON()).toEqual({
      "/alpha/journeys/Login/Login.json": JSON.stringify(journey, null, 2),
      "/alpha/journeys/Login/nodes/Frob - 5.json": JSON.stringify(
        scriptNode,
        null,
        2
      ),
      "/alpha/scripts/scripts-config/555.json": JSON.stringify(
        {
          ...scriptConfig,
          script: {
            file: "scripts-content/AUTHENTICATION_TREE_DECISION_NODE/Frob.js",
          },
        },
        null,
        2
      ),
      "/alpha/scripts/scripts-content/AUTHENTICATION_TREE_DECISION_NODE/Frob.js":
        "log('Hi')",
    });
  })
);
