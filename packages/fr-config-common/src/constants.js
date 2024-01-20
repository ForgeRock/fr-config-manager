const PrivateKeyFormat = {
  JWK: "JWK",
  PEM: "PEM",
};

const THEME_HTML_FIELDS = [
  { name: "accountFooter", encoded: false },
  { name: "journeyFooter", encoded: false },
  { name: "journeyHeader", encoded: false },
  { name: "journeyJustifiedContent", encoded: false },
  { name: "journeyFooterScriptTag", encoded: true },
];

module.exports.PrivateKeyFormat = PrivateKeyFormat;
module.exports.THEME_HTML_FIELDS = THEME_HTML_FIELDS;
