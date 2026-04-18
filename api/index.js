import serverless from 'serverless-http'
import { createApp } from '../server/app.mjs'

const app = createApp()
const serverlessHandler = serverless(app)

export default async function handler(req, res) {
  return serverlessHandler(req, res)
}
