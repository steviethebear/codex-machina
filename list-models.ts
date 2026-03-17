import * as fs from 'fs'
import * as dotenv from 'dotenv'

const envConfig = dotenv.parse(fs.readFileSync('.env.local'))
const apiKey = envConfig.GOOGLE_GENERATIVE_AI_API_KEY || envConfig.GEMINI_API_KEY

async function run() {
    if (!apiKey) {
        console.error("No API key found in .env.local")
        return
    }
    console.log("Fetching models...")
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
    const json = await res.json()
    
    if (json.models) {
        const embedModels = json.models.filter((m: any) => m.name.includes("text-embedding"))
        console.log("Embedding Models:")
        console.log(JSON.stringify(embedModels, null, 2))
    } else {
        console.error("Failed:", json)
    }
}

run()
