// Adapts the existing Vercel-style handlers, written as (request, response) with
// Node http.IncomingMessage/ServerResponse semantics, to Netlify's Lambda-compatible
// (event, context) => ({statusCode, headers, body}) function signature. This lets the
// route handlers and _content.js/_auth.js business logic move over unchanged.

function buildRequest(event, functionName) {
  const headers = {};
  for (const [key, value] of Object.entries(event.headers || {})) {
    headers[key.toLowerCase()] = value;
  }

  const query = {};
  for (const [key, value] of Object.entries(event.queryStringParameters || {})) {
    if (value !== undefined) {
      query[key] = value;
    }
  }

  const slug = extractSlugFromPath(event.path || "", functionName);
  if (slug) {
    query.slug = slug;
  }

  // uploads.js's GET handler parses request.url with `new URL()` directly
  // (rather than reading request.query like every other handler), so the
  // query string needs to actually be present here too.
  const queryString = new URLSearchParams(query).toString();
  const url = (event.path || "/") + (queryString ? `?${queryString}` : "");

  const bodyBuffer = event.body
    ? Buffer.from(event.body, event.isBase64Encoded ? "base64" : "utf8")
    : Buffer.alloc(0);

  const listeners = {};
  let destroyed = false;
  let emitted = false;

  function emit() {
    if (emitted || destroyed) {
      return;
    }

    emitted = true;
    (listeners.data || []).forEach((callback) => callback(bodyBuffer));

    if (destroyed) {
      return;
    }

    (listeners.end || []).forEach((callback) => callback());
  }

  const request = {
    method: event.httpMethod,
    headers,
    query,
    url,
    on(eventName, callback) {
      (listeners[eventName] = listeners[eventName] || []).push(callback);

      // The whole body is already buffered (Lambda invocations aren't
      // actually streamed), so there's nothing to wait on. Every handler in
      // this codebase registers "data" before "end" synchronously within the
      // same collectRequestBody() call, so firing here — rather than on a
      // fixed delay/microtask — is correct even when real async work (e.g. a
      // Netlify Blobs read) happens between request creation and this point.
      if (eventName === "end") {
        emit();
      }

      return request;
    },
    destroy() {
      destroyed = true;
    },
  };

  return request;
}

function extractSlugFromPath(requestPath, functionName) {
  const marker = `/${functionName}/`;
  const index = requestPath.indexOf(marker);

  if (index === -1) {
    return "";
  }

  const remainder = requestPath.slice(index + marker.length).replace(/\/+$/, "");

  try {
    return decodeURIComponent(remainder);
  } catch {
    return remainder;
  }
}

function buildResponse() {
  const state = {
    statusCode: 200,
    headers: {},
    bodyChunks: [],
  };

  const response = {
    get statusCode() {
      return state.statusCode;
    },
    set statusCode(value) {
      state.statusCode = value;
    },
    setHeader(key, value) {
      state.headers[key] = value;
    },
    end(chunk) {
      if (chunk !== undefined && chunk !== null) {
        state.bodyChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk), "utf8"));
      }
    },
  };

  return { response, state };
}

function toLambdaResponse(state) {
  const bodyBuffer = Buffer.concat(state.bodyChunks);
  const contentType = state.headers["Content-Type"] || state.headers["content-type"] || "";
  const isTextual = bodyBuffer.length === 0 || /json|text|xml|svg\+xml/i.test(contentType);

  return {
    statusCode: state.statusCode,
    headers: state.headers,
    body: isTextual ? bodyBuffer.toString("utf8") : bodyBuffer.toString("base64"),
    isBase64Encoded: !isTextual,
  };
}

function withLegacyHandler(functionName, legacyHandler) {
  return async function netlifyHandler(event) {
    const request = buildRequest(event, functionName);
    const { response, state } = buildResponse();

    await legacyHandler(request, response);

    return toLambdaResponse(state);
  };
}

module.exports = { withLegacyHandler };
