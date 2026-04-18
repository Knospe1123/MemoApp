import { createApp } from '../server/app.mjs'

const app = createApp()

/** Shared Vercel Node entry for Express (no serverless-http). */
export default function handler(req, res) {
  app(req, res)
}
