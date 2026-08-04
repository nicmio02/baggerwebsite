#!/usr/bin/env node
// One-time data migration: copies the live CMS content and uploaded images
// from Vercel Blob into Netlify Blobs. Read-only against Vercel — nothing is
// ever deleted there. Defaults to a dry run; pass --write to actually copy.
//
// Required env vars:
//   BLOB_READ_WRITE_TOKEN  - Vercel Blob read-write token (source)
//   NETLIFY_SITE_ID        - the Netlify site to copy into (destination)
//   NETLIFY_AUTH_TOKEN     - a Netlify personal access token (destination)

const { list, get } = require("@vercel/blob");
const { getStore } = require("@netlify/blobs");

const write = process.argv.includes("--write");

const vercelToken = process.env.BLOB_READ_WRITE_TOKEN;
const netlifySiteId = process.env.NETLIFY_SITE_ID;
const netlifyAuthToken = process.env.NETLIFY_AUTH_TOKEN;

const sources = [
  { prefix: "cms/", storeName: "cms" },
  { prefix: "uploads/", storeName: "uploads" },
];

function requireEnv(name, value) {
  if (!value) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
}

function netlifyStore(storeName) {
  return getStore({
    name: storeName,
    siteID: netlifySiteId,
    token: netlifyAuthToken,
    consistency: "strong",
  });
}

async function migratePrefix({ prefix, storeName }) {
  const { blobs } = await list({ prefix, token: vercelToken });

  if (blobs.length === 0) {
    console.log(`  (nothing found under "${prefix}")`);
    return { count: 0, bytes: 0 };
  }

  let copied = 0;
  let bytes = 0;

  for (const blob of blobs) {
    const key = blob.pathname.slice(prefix.length);

    if (!write) {
      console.log(`  would copy: ${blob.pathname} -> netlify:${storeName}/${key} (${blob.size} bytes)`);
      copied += 1;
      bytes += blob.size;
      continue;
    }

    const result = await get(blob.pathname, {
      access: "private",
      token: vercelToken,
      useCache: false,
    });

    if (result?.statusCode !== 200 || !result.stream) {
      console.error(`  ! failed to read ${blob.pathname}, skipping`);
      continue;
    }

    const arrayBuffer = await new Response(result.stream).arrayBuffer();

    await netlifyStore(storeName).set(key, arrayBuffer, {
      metadata: { contentType: result.blob.contentType },
    });

    console.log(`  copied: ${blob.pathname} -> netlify:${storeName}/${key} (${arrayBuffer.byteLength} bytes)`);
    copied += 1;
    bytes += arrayBuffer.byteLength;
  }

  return { count: copied, bytes };
}

async function main() {
  requireEnv("BLOB_READ_WRITE_TOKEN", vercelToken);
  requireEnv("NETLIFY_SITE_ID", netlifySiteId);
  requireEnv("NETLIFY_AUTH_TOKEN", netlifyAuthToken);

  console.log(
    write
      ? `Copying data from Vercel Blob to Netlify Blobs (site ${netlifySiteId})...\n`
      : "Dry run — nothing will be written or deleted. Pass --write to actually copy.\n",
  );

  let totalCount = 0;
  let totalBytes = 0;

  for (const source of sources) {
    console.log(source.prefix);
    const { count, bytes } = await migratePrefix(source);
    totalCount += count;
    totalBytes += bytes;
  }

  console.log(`\n${write ? "Copied" : "Would copy"} ${totalCount} object(s), ${(totalBytes / 1024).toFixed(1)} KB total.`);

  if (!write) {
    console.log("Re-run with --write to actually perform the copy. Vercel data is never deleted.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
