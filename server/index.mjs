import { createApp } from './app.mjs'

const app = createApp()
const port = Number(process.env.PORT) || 4000

app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`)
})
