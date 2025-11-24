
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing environment variables')
    console.log('Available keys:', Object.keys(process.env).filter(k => k.includes('SUPABASE')))
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAtoms() {
    console.log('Checking atomic_notes table...')

    // 1. Count total atoms
    const { count, error: countError } = await supabase
        .from('atomic_notes')
        .select('*', { count: 'exact', head: true })

    if (countError) {
        console.error('Error counting atoms:', countError)
    } else {
        console.log(`Total atoms in DB: ${count}`)
    }

    // 2. Try the query used in the page
    console.log('Testing page query...')
    const { data, error } = await supabase
        .from('atomic_notes')
        .select(`
        *,
        users (codex_name),
        texts (title)
    `)
        .limit(5)

    if (error) {
        console.error('Query error:', error)
    } else {
        console.log(`Query successful. Retrieved ${data?.length} rows.`)
        if (data && data.length > 0) {
            console.log('Sample atom keys:', Object.keys(data[0]))
            console.log('Sample atom quality_flag:', data[0].quality_flag)
        }
    }
}

checkAtoms()
