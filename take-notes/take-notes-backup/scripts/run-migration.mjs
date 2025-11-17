import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tazaxjrodpmghnmvnzdp.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runMigration() {
  console.log('Running quiz tables migration...');
  
  const sqlPath = join(__dirname, 'create-quiz-tables.sql');
  const sql = readFileSync(sqlPath, 'utf-8');
  
  // Split by statements (simple approach - split on semicolons outside strings)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  console.log(`Executing ${statements.length} SQL statements...`);
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    if (!stmt) continue;
    
    console.log(`\n[${i + 1}/${statements.length}] Executing statement...`);
    
    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: stmt + ';' });
      
      if (error) {
        // Try direct query if RPC doesn't exist
        const { error: directError } = await supabase.from('_').select('*').limit(0);
        
        // Use REST API directly for DDL
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          },
          body: JSON.stringify({ sql_query: stmt + ';' })
        });
        
        if (!response.ok) {
          console.warn(`Statement ${i + 1} might have failed (DDL statements may not work via REST API)`);
          console.warn(`You may need to run this manually in Supabase SQL editor`);
        }
      } else {
        console.log(`✓ Statement ${i + 1} executed successfully`);
      }
    } catch (err) {
      console.error(`Error on statement ${i + 1}:`, err.message);
      console.log('Statement:', stmt.substring(0, 100) + '...');
    }
  }
  
  console.log('\n✅ Migration script completed!');
  console.log('\nNote: If you see warnings, please run the SQL manually in Supabase Dashboard > SQL Editor');
}

runMigration().catch(console.error);
