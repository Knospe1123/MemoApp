import { spawnSync } from 'node:child_process'

function run(label, command, args) {
  console.log(`\n> ${label}`)
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: true,
    env: process.env,
  })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

run('prisma generate', 'npx', ['prisma', 'generate'])

if (process.env.DATABASE_URL) {
  run('prisma migrate deploy', 'npx', ['prisma', 'migrate', 'deploy'])
} else {
  console.warn(
    '\nSkipping prisma migrate deploy: DATABASE_URL is not set. Add it in Vercel → Settings → Environment Variables, then redeploy.',
  )
}

run('vite build', 'npx', ['vite', 'build'])
