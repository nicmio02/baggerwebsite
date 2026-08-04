// Netlify is supposed to auto-inject Blobs credentials into every deployed
// Function, but that injection is unreliable in production for some sites
// even when getStore() is called correctly inside the handler (a known,
// currently-open platform issue: netlify/blobs#175 and multiple threads on
// answers.netlify.com about MissingBlobsEnvironmentError "despite following
// documentation"). Falling back to explicit siteID/token sidesteps it.
//
// SITE_ID is one of Netlify's standard auto-provided env vars, no setup
// needed. NETLIFY_BLOBS_TOKEN is a personal access token that must be added
// manually as a site environment variable (Site configuration > Environment
// variables) — separate from any token used for one-off local scripts.
function getBlobsClientOptions() {
  const siteID = process.env.SITE_ID;
  const token = process.env.NETLIFY_BLOBS_TOKEN;

  return siteID && token ? { siteID, token } : {};
}

module.exports = { getBlobsClientOptions };
