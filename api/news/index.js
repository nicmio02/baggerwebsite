const { handleCollection } = require("../_content");

module.exports = async function handler(request, response) {
  await handleCollection(request, response, "news");
};
