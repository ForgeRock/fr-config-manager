const fs = require("fs");
const path = require("path");
const { restPut } = require("../../../fr-config-common/src/restClient");
const glob = require("glob");
const { readFile } = require("fs/promises");
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
  return new Promise((resolve, reject) => {
    glob(globPattern, { cwd: dir }, async (error, nodes) => {
      if (error) {
        reject(error);
        return;
      }

      for (const nodeFile of nodes) {
        const node = JSON.parse(await readFile(path.join(dir, nodeFile)));
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
          // console.log("pushing script", node.script);
          await pushScriptById(
            configDir,
            node.script,
            tenantBaseUrl,
            realm,
            token
          );
        }
        await pushNode(baseUrl, node, token);
      }
      resolve();
    });
  });
}

function pushNode(baseUrl, node, token) {
  return new Promise((resolve, reject) => {
    const nodeRequestUrl = `${baseUrl}/nodes/${node._type._id}/${node._id}`;
    delete node._rev;
    restPut(nodeRequestUrl, node, token).then(resolve).catch(reject);
  });
}

function pushJourney(journey, baseUrl, token) {
  return new Promise((resolve, reject) => {
    delete journey._rev;
    const requestUrl = `${baseUrl}/trees/${journey._id}`;
    restPut(requestUrl, journey, token).then(resolve).catch(reject);
  });
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

      await glob(
        globPattern,
        { cwd: journeyBaseDir },
        async (error, journeys) => {
          if (error) {
            throw error;
          }

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
      );
    }
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

module.exports = updateAuthTrees;
