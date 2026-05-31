const REGISTRY = require('../models-registry.json');

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { model } = req.query;
  if (!model) return res.status(400).json({ error: 'Missing ?model= param' });

  const found = REGISTRY.models.find(m => m.id === model);
  if (!found) return res.status(404).json({ error: `Model "${model}" not found` });

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

  return res.status(200).json({
    gated: false,
    model_id: found.id,
    name: found.name,
    filename: found.hf_filename,
    size_gb: found.size_gb,
    download_url: `https://huggingface.co/${found.hf_repo}/resolve/main/${found.hf_filename}`,
  });
};
