/**
 * Script to run the Activity Level Wizard migration
 * Run with: npx tsx scripts/run-migration.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!')
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  console.log('🚀 Running Activity Level Wizard migration...')

  const migrationPath = path.join(
    __dirname,
    '../supabase/migrations/20260102000000_add_activity_level_wizard_fields.sql'
  )

  const sql = fs.readFileSync(migrationPath, 'utf-8')

  try {
    const { error } = await supabase.rpc('exec_sql', { sql_string: sql })

    if (error) {
      console.error('❌ Migration failed:', error)
      process.exit(1)
    }

    console.log('✅ Migration completed successfully!')
  } catch (err) {
    console.error('❌ Error running migration:', err)
    process.exit(1)
  }
}

runMigration()
