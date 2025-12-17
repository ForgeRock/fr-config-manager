let cookieCache = null;

function setCookies(cookies) {
  cookieCache = cookies && cookies.length > 0 ? cookies : null;
}

function getCookies() {
  return cookieCache;
}

module.exports.setCookies = setCookies;
module.exports.getCookies = getCookies;
