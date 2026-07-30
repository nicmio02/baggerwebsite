const { handleJobSettings } = require("./_shared/content");
const { withLegacyHandler } = require("./_shared/shim");

async function legacyHandler(request, response) {
  await handleJobSettings(request, response);
}

exports.handler = withLegacyHandler("jobs-settings", legacyHandler);
