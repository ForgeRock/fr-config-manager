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
];

const CSP_SUBDIR = "csp";
const CSP_POLICIES = ["enforced", "report-only"];

module.exports.PrivateKeyFormat = PrivateKeyFormat;
module.exports.THEME_HTML_FIELDS = THEME_HTML_FIELDS;
module.exports.CSP_POLICIES = CSP_POLICIES;
module.exports.CSP_SUBDIR = CSP_SUBDIR;
module.exports.ACCESS_TOKEN_ENV_VAR = ACCESS_TOKEN_ENV_VAR;
