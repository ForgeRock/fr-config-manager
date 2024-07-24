const fs = require("fs");
const path = require("path");
const { restPut } = require("../../../fr-config-common/src/restClient");
const { globSync } = require("glob");
const { pushScriptById } = require("./update-scripts");
const cliUtils = require("../helpers/cli-options");
const { OPTION } = cliUtils;

const INNER_TREE_ID = "InnerTreeEvaluatorNode";

async function handleNodes(
  configDir,
  dir,
  globPattern,
  baseUrl,
  tenantBaseUrl,
  realm,
  pushInnerJourneys,
  pushScripts,
  journeysProcessed,
  token
) {
  const nodeFiles = globSync(globPattern, { cwd: dir });

  for (const nodeFile of nodeFiles) {
    const node = JSON.parse(fs.readFileSync(path.join(dir, nodeFile)));
    if (node._type._id === INNER_TREE_ID && pushInnerJourneys) {
      const journeyDir = path.resolve(dir, "../../");
      const journeyFile = `${node.tree}/${node.tree}.json`;
      await handleJourney(
        configDir,
        journeyFile,
        tenantBaseUrl,
        realm,
        pushInnerJourneys,
        pushScripts,
        journeysProcessed,
        token
      );
    } else if (
      pushScripts &&
      (node._type._id === "ScriptedDecisionNode" ||
        node._type._id === "ConfigProviderNode")
    ) {
      await pushScriptById(configDir, node.script, tenantBaseUrl, realm, token);
    }
    await pushNode(baseUrl, node, token);
  }
}

async function pushNode(baseUrl, node, token) {
  const nodeRequestUrl = `${baseUrl}/nodes/${node._type._id}/${node._id}`;
  delete node._rev;
  await restPut(nodeRequestUrl, node, token, "protocol=2.1,resource=1.0");
}

async function pushJourney(journey, baseUrl, token) {
  delete journey._rev;
  const requestUrl = `${baseUrl}/trees/${journey._id}`;
  await restPut(requestUrl, journey, token, "protocol=2.1,resource=1.0");
}

async function handleJourney(
  configDir,
  journeyFile,
  tenantBaseUrl,
  realm,
  pushInnerJourneys,
  pushScripts,
  journeysProcessed,
  token
) {
  const dir = path.join(configDir, `/realms/${realm}/journeys`);
  const journeyFullPath = path.join(dir, journeyFile);

  if (journeysProcessed.includes(journeyFullPath)) {
    return;
  }

  journeysProcessed.push(journeyFullPath);

  const journey = JSON.parse(fs.readFileSync(journeyFullPath));

  const baseUrl = `${tenantBaseUrl}/am/json/realms/root/realms/${realm}/realm-config/authentication/authenticationtrees`;

  const journeyDir = path.dirname(journeyFile);
  const nodeDir = `${dir}/${journeyDir}/nodes`;

  console.log(`Pushing journey ${realm}/${journey._id}`);

  //paged nodes
  await handleNodes(
    configDir,
    nodeDir,
    "*/*.json",
    baseUrl,
    tenantBaseUrl,
    realm,
    pushInnerJourneys,
    pushScripts,
    journeysProcessed,
    token
  );
  // nodes
  await handleNodes(
    configDir,
    nodeDir,
    "*.json",
    baseUrl,
    tenantBaseUrl,
    realm,
    pushInnerJourneys,
    pushScripts,
    journeysProcessed,
    token
  );

  await pushJourney(journey, baseUrl, token);
}

const updateAuthTrees = async (argv, token) => {
  const { REALMS, TENANT_BASE_URL, CONFIG_DIR } = process.env;

  const realms = argv[OPTION.REALM] ? [argv[OPTION.REALM]] : JSON.parse(REALMS);

  const journeyName = argv[OPTION.NAME];

  const pushInnerJourneys = !journeyName || argv[OPTION.PUSH_DEPENDENCIES];

  const pushScripts = argv[OPTION.PUSH_DEPENDENCIES];

  if (journeyName) {
    if (realms.length !== 1) {
      console.error("Error: for a named journey, specify a single realm");
      process.exit(1);
    } else {
      console.log(
        "Updating journey",
        `"${journeyName}"`,
        pushInnerJourneys ? "including inner journeys" : "",
        pushScripts ? "and scripts" : ""
      );
    }
  } else {
    console.log(
      "Updating Journeys",
      pushInnerJourneys ? "including inner journeys" : "",
      pushScripts ? "and scripts" : ""
    );
  }

  var journeysProcessed = [];

  try {
    for (const realm of realms) {
      const journeyBaseDir = path.join(CONFIG_DIR, `/realms/${realm}/journeys`);
      if (!fs.existsSync(journeyBaseDir)) {
        console.log(`Warning: no journey config defined for realm ${realm}`);
        continue;
      }

      const globPattern = journeyName ? `${journeyName}/*.json` : "*/*.json";

      const journeys = globSync(globPattern, { cwd: journeyBaseDir });

      if (journeys.length === 0) {
        console.error("No journeys found");
        process.exit(1);
      }

      for (const journeyFile of journeys) {
        await handleJourney(
          CONFIG_DIR,
          journeyFile,
          TENANT_BASE_URL,
          realm,
          pushInnerJourneys,
          pushScripts,
          journeysProcessed,
          token
        );
      }
    }
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

module.exports = updateAuthTrees;
