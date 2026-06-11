const { handleCollection } = require("../_content");

module.exports = function handler(request, response) {
  handleCollection(request, response, "projects");
};
