const PrivateKeyFormat = {
  JWK: "JWK",
  PEM: "PEM",
};

const ACCESS_TOKEN_ENV_VAR = "TENANT_ACCESS_TOKEN";

const THEME_HTML_FIELDS = [
  { name: "accountFooter", encoded: false },
  { name: "journeyFooter", encoded: false },
  { name: "journeyHeader", encoded: false },
  { name: "journeyJustifiedContent", encoded: false },
  { name: "journeyFooterScriptTag", encoded: true },
  { name: "accountFooterScriptTag", encoded: true },
];

const CSP_SUBDIR = "csp";
const CSP_POLICIES = ["enforced", "report-only"];

const ORG_PRIVILEGES_CONFIG = [
  "alphaOrgPrivileges",
  "bravoOrgPrivileges",
  "privilegeAssignments",
];

const STDOUT_OPTION = "stdout";
const STDOUT_OPTION_SHORT = "o";

const STDIN_OPTION = "stdin";
const STDIN_OPTION_SHORT = "i";

module.exports.PrivateKeyFormat = PrivateKeyFormat;
module.exports.THEME_HTML_FIELDS = THEME_HTML_FIELDS;
module.exports.CSP_POLICIES = CSP_POLICIES;
module.exports.CSP_SUBDIR = CSP_SUBDIR;
module.exports.ACCESS_TOKEN_ENV_VAR = ACCESS_TOKEN_ENV_VAR;
module.exports.ORG_PRIVILEGES_CONFIG = ORG_PRIVILEGES_CONFIG;
module.exports.STDOUT_OPTION = STDOUT_OPTION;
module.exports.STDOUT_OPTION_SHORT = STDOUT_OPTION_SHORT;
module.exports.STDIN_OPTION = STDIN_OPTION;
module.exports.STDIN_OPTION_SHORT = STDIN_OPTION_SHORT;
