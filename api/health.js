/** Direct function so GET /api/health hits filesystem before catch-all rewrite. */
export default function handler(_req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.status(200).end(JSON.stringify({ ok: true }))
}
