const { handleSiteText } = require("./_shared/content");
const { withLegacyHandler } = require("./_shared/shim");

async function legacyHandler(request, response) {
  await handleSiteText(request, response);
}

exports.handler = withLegacyHandler("site-text", legacyHandler);
