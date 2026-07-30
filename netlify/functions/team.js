const { handleCollection, handleItem } = require("./_shared/content");
const { withLegacyHandler } = require("./_shared/shim");

async function legacyHandler(request, response) {
  const slug = Array.isArray(request.query?.slug) ? request.query.slug[0] : request.query?.slug;

  if (slug) {
    await handleItem(request, response, "team", slug);
    return;
  }

  await handleCollection(request, response, "team");
}

exports.handler = withLegacyHandler("team", legacyHandler);
