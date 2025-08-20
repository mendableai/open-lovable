#!/usr/bin/env node
/*
 Sets Cloudflare Pages compatibility flags for both production and preview environments.
 Requires environment variables:
  - CF_API_TOKEN (with Pages:Edit permissions)
  - CF_ACCOUNT_ID
  - CF_PAGES_PROJECT
 Optional:
  - CF_COMPAT_FLAGS (comma-separated, default: nodejs_compat)
*/

const API_BASE = 'https://api.cloudflare.com/client/v4';

async function main() {
  const token = process.env.CF_API_TOKEN;
  const accountId = process.env.CF_ACCOUNT_ID;
  const project = process.env.CF_PAGES_PROJECT;
  const flags = (process.env.CF_COMPAT_FLAGS || 'nodejs_compat')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (!token || !accountId || !project) {
    console.log('[cf-compat] Missing CF_API_TOKEN / CF_ACCOUNT_ID / CF_PAGES_PROJECT. Skipping.');
    process.exit(0);
  }

  const url = `${API_BASE}/accounts/${accountId}/pages/projects/${project}/deployment_configs`;
  const body = {
    production: { compatibility_flags: flags },
    preview: { compatibility_flags: flags },
  };

  console.log(`[cf-compat] Setting compatibility flags for project "${project}":`, flags);
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    console.error('[cf-compat] Failed to set flags:', json.errors || json);
    process.exit(1);
  }

  console.log('[cf-compat] Compatibility flags updated successfully.');
}

main().catch((err) => {
  console.error('[cf-compat] Unexpected error:', err);
  process.exit(1);
});

