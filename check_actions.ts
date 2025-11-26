
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function checkActionTypes() {
    const { data, error } = await supabase
        .from('actions')
        .select('type')

    if (error) {
        console.error('Error:', error)
        return
    }

    const uniqueTypes = [...new Set(data.map(a => a.type))]
    console.log('Unique Action Types:', uniqueTypes)
}

checkActionTypes()
