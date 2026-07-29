const { handleCollection, handleItem } = require("../_content");

module.exports = async function handler(request, response) {
  const slug = Array.isArray(request.query?.slug) ? request.query.slug[0] : request.query?.slug;

  if (slug) {
    await handleItem(request, response, "team", slug);
    return;
  }

  await handleCollection(request, response, "team");
};
