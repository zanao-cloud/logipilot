import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = readFileSync('.env.local', 'utf8')
const get = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^["']|["']$/g, '')

const url = get('NEXT_PUBLIC_SUPABASE_URL')
const key = get('SUPABASE_SERVICE_ROLE_KEY')

if (!url || !key) {
  console.error('Faltam variáveis NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY em .env.local')
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

const sql = readFileSync('lib/supabase/migrations-avatars.sql', 'utf8')

const projectRef = url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]

if (!projectRef) {
  console.error('Não consegui detectar project ref a partir da SUPABASE_URL')
  process.exit(1)
}

const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${get('SUPABASE_ACCESS_TOKEN') || ''}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: sql }),
})

if (!res.ok) {
  const body = await res.text()
  console.error('Falha na API de management. Tentando rota alternativa via PostgREST RPC...')
  console.error(body)

  console.log('\n→ Execute o SQL abaixo manualmente no Supabase SQL Editor:\n')
  console.log(sql)
  process.exit(1)
}

console.log('Migração de avatares aplicada com sucesso.')
