const utils = require("../../../fr-config-common/src/utils.js");
const fs = require("fs");
const { restGet } = require("../../../fr-config-common/src/restClient.js");
const { saveJsonToFile } = utils;
const path = require("path");

const EXPORT_SUBDIR = "iga/workflows";

function breakoutSteps(workflow, workflowPath) {
  const stepsPath = path.join(workflowPath, "steps");
  workflow.steps.forEach((step) => {
    const uniqueId = `${step.displayName} - ${step.name}`;
    const stepPath = path.join(stepsPath, uniqueId);
    if (!fs.existsSync(stepPath)) {
      fs.mkdirSync(stepPath, { recursive: true });
    }

    if (
      step.type === "scriptTask" &&
      step.scriptTask &&
      step.scriptTask.script
    ) {
      const scriptFilename = `${uniqueId}.js`;

      fs.writeFileSync(
        path.join(stepPath, scriptFilename),
        step.scriptTask.script
      );
      step.scriptTask.script = { file: scriptFilename };
    }

    const fileName = path.join(stepPath, `${uniqueId}.json`);
    saveJsonToFile(step, fileName);
  });
  delete workflow.steps;
}

function processWorkflows(workflows, targetDir, name, inlcudeImmutable) {
  let workflowFound = false;
  try {
    workflows.forEach((workflow) => {
      if (name && name !== workflow.name) {
        return;
      }

      if (!workflow.mutable && !inlcudeImmutable) {
        return;
      }

      workflowFound = true;

      const workflowPath = path.join(targetDir, workflow.name);

      if (!fs.existsSync(workflowPath)) {
        fs.mkdirSync(workflowPath, { recursive: true });
      }

      breakoutSteps(workflow, workflowPath);

      const fileName = path.join(workflowPath, `${workflow.name}.json`);
      saveJsonToFile(workflow, fileName);
    });
  } catch (err) {
    console.error(err);
  }
  return workflowFound;
}

async function exportIgaWorkflows(
  exportDir,
  tenantUrl,
  name,
  token,
  includeImmutable
) {
  try {
    const igaEndpoint = `${tenantUrl}/auto/orchestration/definition`;

    const pageSize = { _pageSize: 100 };
    const response = await restGet(igaEndpoint, pageSize, token);

    const workflows = response.data.result;

    const fileDir = `${exportDir}/${EXPORT_SUBDIR}`;
    const workflowFound = processWorkflows(
      workflows,
      fileDir,
      name,
      includeImmutable
    );
    if (name && !workflowFound) {
      console.error(`Workflow ${name} not found`);
    }
  } catch (err) {
    console.log(err);
  }
}

module.exports.exportIgaWorkflows = exportIgaWorkflows;
