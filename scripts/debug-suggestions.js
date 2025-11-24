const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load env
const envPath = path.resolve(__dirname, '../.env.local')
try {
    const envContent = fs.readFileSync(envPath, 'utf8')
    const env = {}
    envContent.split('\n').forEach(line => {
        const parts = line.split('=')
        if (parts.length >= 2) {
            const key = parts[0].trim()
            const val = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '') // Remove quotes
            if (key && val) env[key] = val
        }
    })

    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing env vars in .env.local')
        process.exit(1)
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    async function run() {
        console.log('Searching for notes with "cyberspace" in title...')

        const { data: notes, error } = await supabase
            .from('atomic_notes')
            .select('*')
            .ilike('title', '%cyberspace%')

        if (error) {
            console.error('Error:', error)
            return
        }

        console.log(`Found ${notes.length} notes:`)
        notes.forEach(n => {
            console.log(`- [${n.id}] "${n.title}" (User: ${n.user_id}, Status: ${n.moderation_status}, Hidden: ${n.hidden})`)
        })
    }

    run()
} catch (e) {
    console.error('Error reading .env.local:', e.message)
}
