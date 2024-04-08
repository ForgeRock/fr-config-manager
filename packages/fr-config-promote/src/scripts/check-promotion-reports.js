const {
  env
} = require("yargs");
const {
  restGet,
} = require("../../../fr-config-common/src/restClient");
const cliUtils = require("../helpers/cli-options");
const {
  OPTION
} = cliUtils;

async function listAllReports(token) {
  const {
      TENANT_ENV_UPPER_FQDN
  } = process.env;
  try {
      const envUrl = `${TENANT_ENV_UPPER_FQDN}/environment`;
      const response = await restGet(
          `${envUrl}/promotion/reports`,
          null,
          token,
          "protocol=1.0,resource=1.0"
      );

      console.log(JSON.stringify(response.data,null,4));

  } catch (error) {
      console.error(error.message);
      process.exit(1);
  }
}


async function listLastReport(token) {
  const {
      TENANT_ENV_UPPER_FQDN
  } = process.env;
  try {
      const envUrl = `${TENANT_ENV_UPPER_FQDN}/environment`;
      const response = await restGet(
          `${envUrl}/promotion/report`,
          null,
          token,
          "protocol=1.0,resource=1.0"
      );

      console.log(JSON.stringify(response.data,null,4));

  } catch (error) {
      console.error(error.message);
      process.exit(1);
  }
}

async function listReportID(id, token) {
  const {
      TENANT_ENV_UPPER_FQDN
  } = process.env;
  try {
      const envUrl = `${TENANT_ENV_UPPER_FQDN}/environment`;
      const response = await restGet(
          `${envUrl}/promotion/report/${id}`,
          null,
          token,
          "protocol=1.0,resource=1.0"
      );

      console.log(JSON.stringify(response.data,null,4));

  } catch (error) {
      console.error(error.message);
      process.exit(1);
  }
}
const checkPromotionReports = async (argv, token) => {

  const listReports = argv[OPTION.LIST];
  const reportID = argv[OPTION.REPORTID];
  if (reportID) {
      listReportID(reportID, token);
  } else if (listReports) {

      listAllReports(token);
  } else {
      listLastReport(token);
  }


};

module.exports = checkPromotionReports;