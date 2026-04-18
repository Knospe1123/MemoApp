import { spawnSync } from 'node:child_process'

const FAILED_MIGRATION = '20260218103000_init_postgres'

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

function runOptional(label, command, args) {
  console.log(`\n> ${label}`)
  return (
    spawnSync(command, args, {
      stdio: 'inherit',
      shell: true,
      env: process.env,
    }).status === 0
  )
}

run('prisma generate', 'npx', ['prisma', 'generate'])

if (process.env.DATABASE_URL) {
  if (!runOptional('prisma migrate deploy', 'npx', ['prisma', 'migrate', 'deploy'])) {
    console.warn(
      `\nmigrate deploy failed (e.g. P3009). Trying: prisma migrate resolve --rolled-back ${FAILED_MIGRATION} …`,
    )
    runOptional('prisma migrate resolve', 'npx', [
      'prisma',
      'migrate',
      'resolve',
      '--rolled-back',
      FAILED_MIGRATION,
    ])
    if (!runOptional('prisma migrate deploy (retry)', 'npx', ['prisma', 'migrate', 'deploy'])) {
      console.error(
        '\nMigration still failing. In Neon: drop tables "Memo","User" if they exist, clear failed row in _prisma_migrations, then redeploy. See README.',
      )
      process.exit(1)
    }
  }
} else {
  console.warn(
    '\nSkipping prisma migrate deploy: DATABASE_URL is not set. Add it in Vercel → Environment Variables, then redeploy.',
  )
}

run('vite build', 'npx', ['vite', 'build'])
