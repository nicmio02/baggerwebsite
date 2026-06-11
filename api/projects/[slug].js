const { handleItem } = require("../_content");

module.exports = function handler(request, response) {
  handleItem(request, response, "projects", request.query.slug);
};
