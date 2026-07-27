const { handleJobSettings } = require("../_content");

module.exports = async function handler(request, response) {
  await handleJobSettings(request, response);
};
