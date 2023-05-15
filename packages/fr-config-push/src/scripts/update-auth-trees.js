const fs = require("fs");
const path = require("path");
const fidcRequest = require("../helpers/fidc-request");
const glob = require("glob");
const { readFile } = require("fs/promises");

const INNER_TREE_ID = "InnerTreeEvaluatorNode";

async function handleNodes(dir, globPattern, baseurl, token) {
  return new Promise((resolve, reject) => {
    glob(globPattern, { cwd: dir }, async (error, nodes) => {
      if (error) {
        reject(error);
        return;
      }
      for (const nodeFile of nodes) {
        const node = JSON.parse(await readFile(path.join(dir, nodeFile)));
        if (node._type._id === INNER_TREE_ID) {
          const journeyDir = path.resolve(dir, "../../");
          const journeyFile = `${node.tree}/${node.tree}.json`;
          await handleJourney(journeyDir, journeyFile, baseurl, token);
        }
        await pushNode(baseurl, node, token);
      }
      resolve();
    });
  });
}

function pushNode(baseUrl, node, token) {
  return new Promise((resolve, reject) => {
    const nodeRequestUrl = `${baseUrl}/nodes/${node._type._id}/${node._id}`;
    delete node._rev;
    fidcRequest(nodeRequestUrl, node, token).then(resolve).catch(reject);
  });
}

function pushJourney(journey, baseUrl, token) {
  return new Promise((resolve, reject) => {
    delete journey._rev;
    const requestUrl = `${baseUrl}/trees/${journey._id}`;
    fidcRequest(requestUrl, journey, token).then(resolve).catch(reject);
  });
}

async function handleJourney(dir, journeyFile, baseUrl, token) {
  const journey = JSON.parse(fs.readFileSync(path.join(dir, journeyFile)));

  const journeyDir = path.dirname(journeyFile);
  const nodeDir = `${dir}/${journeyDir}/nodes`;

  //paged nodes
  await handleNodes(nodeDir, "*/*.json", baseUrl, token);
  // nodes
  await handleNodes(nodeDir, "*.json", baseUrl, token);

  await pushJourney(journey, baseUrl, token);
}

const updateAuthTrees = async (argv, token) => {
  const { REALMS, TENANT_BASE_URL, CONFIG_DIR, filenameFilter } = process.env;
  console.log("Updating Journeys");

  try {
    for (const realm of JSON.parse(REALMS)) {
      const baseUrl = `${TENANT_BASE_URL}/am/json/realms/root/realms/${realm}/realm-config/authentication/authenticationtrees`;

      const dir = path.join(CONFIG_DIR, `/realms/${realm}/journeys`);

      await glob("*/*.json", { cwd: dir }, async (error, journeys) => {
        if (error) {
          throw error;
        }
        for (const journeyFile of journeys) {
          await handleJourney(dir, journeyFile, baseUrl, token);
        }
      });
    }
    console.log("Journeys updated");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

module.exports = updateAuthTrees;
