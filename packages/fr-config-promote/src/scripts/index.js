const checkTenantsLocked = require("./check-tenants-locked");
const lockTenants = require("./lock-tenants");
const unlockTenants = require("./unlock-tenants");
const checkPromotionStatus = require("./check-promotion-status");
const runPromotion = require("./run-promotion");
const checkPromotionReports = require("./check-promotion-reports");
module.exports = {
  checkTenantsLocked,
  lockTenants,
  unlockTenants,
  checkPromotionStatus,
  runPromotion,
  checkPromotionReports,
};
