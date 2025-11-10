export async function readJson(req) {
  if (req.body !== undefined) {
    if (typeof req.body === 'string') {
      try { return JSON.parse(req.body); } catch { return {}; }
    }
    return req.body || {};
  }
  const chunks = [];
  await new Promise((resolve) => {
    req.on('data', (c) => chunks.push(c));
    req.on('end', resolve);
    req.on('error', resolve);
  });
  if (chunks.length === 0) return {};
  const text = Buffer.concat(chunks).toString('utf8');
  try { return JSON.parse(text); } catch { return {}; }
}


