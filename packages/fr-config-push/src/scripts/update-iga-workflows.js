const fs = require("fs");
const path = require("path");
const {
  restPost,
  restPut,
} = require("../../../fr-config-common/src/restClient");
const cliUtils = require("../helpers/cli-options");
const { OPTION } = cliUtils;

function mergeScriptFile(step, stepPath) {
  if (
    step.type === "scriptTask" &&
    step.scriptTask &&
    step.scriptTask.script &&
    step.scriptTask.script.file
  ) {
    const filePath = path.join(stepPath, step.scriptTask.script.file);
    if (fs.existsSync(filePath)) {
      const source = fs.readFileSync(filePath, {
        encoding: "utf-8",
      });
      step.scriptTask.script = source;
    }
  }
}

function getWorkflowRev(workflow) {
  const secondsNow = Math.floor(new Date() / 1000);
  return secondsNow;
}

const updateIgaWorkflows = async (argv, token) => {
  const { TENANT_BASE_URL, CONFIG_DIR } = process.env;

  const requestedName = argv[OPTION.NAME];

  if (requestedName) {
    console.log("Updating IGA workflow", requestedName);
  } else {
    console.log("Updating IGA workflows");
  }

  const draft = argv[OPTION.DRAFT] ? true : false;
  let workflowFound = false;

  try {
    const workflowDir = path.join(CONFIG_DIR, "iga/workflows");
    if (!fs.existsSync(workflowDir)) {
      console.log(`Warning: workflows directory ${workflowDir} not found`);
      return;
    }

    const workflowPaths = fs
      .readdirSync(`${workflowDir}`, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => path.join(`${workflowDir}`, dirent.name));

    let workflows = [];

    for (const workflowPath of workflowPaths) {
      const workflowName = path.parse(workflowPath).base;
      const workflow = JSON.parse(
        fs.readFileSync(path.join(workflowPath, `${workflowName}.json`))
      );

      if (requestedName && requestedName !== workflow.name) {
        continue;
      }

      workflowFound = true;

      if (!workflow.mutable) {
        console.log("Skipping immutable workflow", workflow.name);
        continue;
      }

      let steps = [];

      const stepsDir = path.join(workflowPath, "steps");
      const stepPaths = fs
        .readdirSync(stepsDir, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => path.join(stepsDir, dirent.name));

      for (const stepPath of stepPaths) {
        const stepName = path.parse(stepPath).base;
        let step = JSON.parse(
          fs.readFileSync(path.join(stepPath, `${stepName}.json`))
        );

        mergeScriptFile(step, stepPath);

        steps.push(step);
      }

      workflow.steps = steps;

      workflow._rev = getWorkflowRev(workflow);

      if (draft) {
        const requestUrl = `${TENANT_BASE_URL}/auto/orchestration/definition/${workflow.id}`;
        await restPut(requestUrl, workflow, token);
      } else {
        const requestUrl = `${TENANT_BASE_URL}/auto/orchestration/definition`;
        await restPost(requestUrl, { _action: "publish" }, workflow, token);
      }
    }

    if (!workflowFound) {
      console.error("Requested workflow", requestedName, "not found");
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = updateIgaWorkflows;
