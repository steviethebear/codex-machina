import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { resolve } from 'path'

// Load env vars
dotenv.config({ path: resolve(__dirname, '../.env.local') })

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase credentials in .env.local')
    process.exit(1)
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function seed() {
    console.log('🌱 Starting v0.5 Seed...')

    // 1. Clean Data (optional, assuming DB reset was done, but cleaning specifically for seed run)
    // Order matters for FK
    await supabase.from('points').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('connections').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('comments').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('notes').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    // We don't delete users usually due to Auth constraints, but we can try to find and reuse or create new ones.

    // 2. Create Users (Auth + Public Profile)
    const users = [
        { email: 'studentA@test.com', name: 'Alice', password: 'password123' },
        { email: 'studentB@test.com', name: 'Bob', password: 'password123' },
        { email: 'studentC@test.com', name: 'Charlie', password: 'password123' },
    ]

    const userIds: Record<string, string> = {}

    for (const u of users) {
        // Sign up or Sign In (Simulated by checking DB)
        // Usually we use admin auth to create user
        const { data: { user }, error } = await supabase.auth.admin.createUser({
            email: u.email,
            password: u.password,
            email_confirm: true,
            user_metadata: { codex_name: u.name }
        })

        let uid = user?.id
        if (error) {
            // User likely exists, fetch from public.users
            const { data: existing } = await supabase.from('users').select('id').eq('email', u.email).single()
            if (existing) uid = existing.id
        }

        if (uid) {
            userIds[u.name] = uid
            // Ensure profile exists
            await supabase.from('users').upsert({ id: uid, email: u.email, codex_name: u.name })
        }
    }

    // Teacher / Admin
    // Using the one from migration usually, but let's ensure we have ID
    const { data: adminUser } = await supabase.from('users').select('id').eq('email', 'admin@test.com').single()
    if (adminUser) userIds['Admin'] = adminUser.id

    console.log('👥 Users Ready:', Object.keys(userIds))

    // 3. Create Sources (Teacher Notes)
    const sources = [
        { title: 'Simulacra and Simulation', content: 'The simulacrum is never that which conceals the truth—it is the truth which conceals that there is none.', citation: 'Baudrillard, Jean. 1981.' },
        { title: 'Understanding Media', content: 'The medium is the message. This is merely to say that the personal and social consequences of any medium result from the new scale...', citation: 'McLuhan, Marshall. 1964.' }
    ]

    const sourceIds: string[] = []
    if (userIds['Admin']) {
        for (const s of sources) {
            const { data } = await supabase.from('notes').insert({
                user_id: userIds['Admin'],
                title: s.title,
                content: s.content,
                citation: s.citation,
                type: 'source',
                is_public: true
            }).select().single()
            if (data) sourceIds.push(data.id)
        }
        console.log(`📚 Created ${sourceIds.length} Sources`)
    }

    // 4. Create Student Notes & Workflow

    // Alice creates a Fleeting note
    const { data: n1 } = await supabase.from('notes').insert({
        user_id: userIds['Alice'],
        title: 'Maps and Territory',
        content: 'I was thinking about how the map is not the territory. It connects to [[Simulacra and Simulation]].',
        type: 'fleeting',
        is_public: false
    }).select().single()

    // Alice Promotes it (Simulating the Server Action logic roughly)
    if (n1) {
        // Update to Permanent
        await supabase.from('notes').update({ type: 'permanent', is_public: true }).eq('id', n1.id)
        // Connection Logic
        // Find Source
        const source = sourceIds[0] // Simulacra matches title partially? Action logic uses Exact Match. 
        // We put [[Simulacra and Simulation]] in content, which matches title "Simulacra and Simulation".
        // Manually insert connection
        if (source) {
            const { data: sNote } = await supabase.from('notes').select('id').eq('title', 'Simulacra and Simulation').single()
            if (sNote) {
                await supabase.from('connections').insert({
                    source_note_id: n1.id,
                    target_note_id: sNote.id,
                    user_id: userIds['Alice'],
                    context: 'I was thinking about how the map is not the territory. It connects to [[Simulacra and Simulation]].'
                })
            }
        }
        // Award Points
        await supabase.from('points').insert({ user_id: userIds['Alice'], amount: 8, reason: 'note_promotion_quality', source_id: n1.id })
    }

    console.log('✅ Alice flow done')

    // Bob creates a note
    const { data: n2 } = await supabase.from('notes').insert({
        user_id: userIds['Bob'],
        title: 'TV as a medium',
        content: 'Watching TV is passive. [[Understanding Media]] says it is a cool medium.',
        type: 'permanent', // Created directly as permanent for seed speed
        is_public: true
    }).select().single()

    if (n2) {
        const { data: sNote } = await supabase.from('notes').select('id').eq('title', 'Understanding Media').single()
        if (sNote) {
            await supabase.from('connections').insert({
                source_note_id: n2.id,
                target_note_id: sNote.id,
                user_id: userIds['Bob'],
                context: '[[Understanding Media]] says it is a cool medium.'
            })
        }
        await supabase.from('points').insert({ user_id: userIds['Bob'], amount: 6, reason: 'note_promotion_quality', source_id: n2.id })
    }

    console.log('✅ Bob flow done')

    console.log('🌱 Seed Complete!')
}

seed().catch(console.error)
