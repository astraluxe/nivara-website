/**
 * VERCEL API ROUTES — Models Registry
 * =====================================
 * Place these in your Krew Next.js project:
 *
 *   pages/api/models/registry.js   ← serves the full model catalogue
 *   pages/api/models/pull.js       ← resolves model ID to HuggingFace download URL
 *
 * Or if you're using App Router (app/):
 *   app/api/models/registry/route.js
 *   app/api/models/pull/route.js
 *
 * Both routes have CORS enabled so the desktop app + website can call them.
 */

// ─────────────────────────────────────────────────────────────────────────────
// FILE: pages/api/models/registry.js
// ─────────────────────────────────────────────────────────────────────────────

const REGISTRY = require('../../../api/models-registry.json');
// Note: copy models-registry.json from NIVARA/api/ into the root of your krew project

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  return res.status(200).json(REGISTRY);
}

// ─────────────────────────────────────────────────────────────────────────────
// FILE: pages/api/models/pull.js
// ─────────────────────────────────────────────────────────────────────────────

const REGISTRY_PULL = require('../../../api/models-registry.json');

export default function handlerPull(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { model } = req.query;
  if (!model) return res.status(400).json({ error: 'Missing ?model= param' });

  const found = REGISTRY_PULL.models.find(m => m.id === model);
  if (!found) return res.status(404).json({ error: `Model "${model}" not found in registry` });

  if (found.gated) {
    return res.status(200).json({
      gated: true,
      model_id: found.id,
      name: found.name,
      license: found.license,
      hf_repo: found.hf_repo,
      hf_filename: found.hf_filename,
      token_url: `https://huggingface.co/${found.hf_repo}`,
      message: `${found.name} requires accepting the ${found.license} license on HuggingFace. Open the URL, accept the terms, copy your HuggingFace token, and paste it in the download dialog.`,
    });
  }

  const download_url = `https://huggingface.co/${found.hf_repo}/resolve/main/${found.hf_filename}`;

  return res.status(200).json({
    gated: false,
    model_id: found.id,
    name: found.name,
    filename: found.hf_filename,
    size_gb: found.size_gb,
    download_url,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// APP ROUTER EQUIVALENT (if you use app/ directory):
// ─────────────────────────────────────────────────────────────────────────────

/*
// app/api/models/registry/route.js
import { NextResponse } from 'next/server';
import REGISTRY from '@/api/models-registry.json';

export async function GET() {
  return NextResponse.json(REGISTRY, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}

// app/api/models/pull/route.js
import { NextResponse } from 'next/server';
import REGISTRY from '@/api/models-registry.json';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const model = searchParams.get('model');
  if (!model) return NextResponse.json({ error: 'Missing ?model= param' }, { status: 400 });

  const found = REGISTRY.models.find(m => m.id === model);
  if (!found) return NextResponse.json({ error: `Model "${model}" not found` }, { status: 404 });

  if (found.gated) {
    return NextResponse.json({
      gated: true,
      model_id: found.id,
      name: found.name,
      license: found.license,
      hf_repo: found.hf_repo,
      hf_filename: found.hf_filename,
      token_url: `https://huggingface.co/${found.hf_repo}`,
      message: `${found.name} requires accepting the ${found.license} license on HuggingFace.`,
    }, { headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  return NextResponse.json({
    gated: false,
    model_id: found.id,
    name: found.name,
    filename: found.hf_filename,
    size_gb: found.size_gb,
    download_url: `https://huggingface.co/${found.hf_repo}/resolve/main/${found.hf_filename}`,
  }, { headers: { 'Access-Control-Allow-Origin': '*' } });
}
*/
