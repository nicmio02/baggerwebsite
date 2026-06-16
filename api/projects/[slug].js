const { handleItem } = require("../_content");

module.exports = async function handler(request, response) {
  await handleItem(request, response, "projects", request.query.slug);
};
