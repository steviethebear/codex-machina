'use server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function checkMeaning(title: string, body: string): Promise<'meaningful' | 'unclear' | 'not meaningful'> {
    const text = (title + " " + body).trim();

    // 1. Try Gemini API if key is present
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('Checking meaning for:', text.substring(0, 20) + '...');

    if (apiKey) {
        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-pro-latest"];
            let analysis = "";

            for (const modelName of modelsToTry) {
                try {
                    console.log(`Attempting with model: ${modelName}`);
                    const model = genAI.getGenerativeModel({ model: modelName });

                    const prompt = `
                    You are a content moderator for an academic RPG.
                    Analyze the following text. It should be a coherent thought, question, idea, or insight.
                    
                    STRICTLY REJECT (return "not meaningful") if the text is:
                    - Gibberish, random keys, or keyboard smashing (e.g., "asdf", "lksjdfl", "a;;lsj;alj")
                    - Mixed valid words and gibberish (e.g., "This is a asdf jkl")
                    - Nonsense or incoherent sentences
                    - Spam or repetitive patterns
                    
                    ALLOW (return "meaningful") if the text is:
                    - A valid sentence or thought (even if simple or with typos)
                    - A meta-comment or test (e.g., "Testing this feature")
                    - A question or idea
                    
                    Text to analyze: "${text}"
                    
                    Respond with ONLY one of these three strings:
                    - "meaningful"
                    - "unclear"
                    - "not meaningful"
                    `;

                    const result = await model.generateContent(prompt);
                    const response = result.response;
                    analysis = response.text().trim().toLowerCase().replace(/['"]/g, '');
                    console.log(`Gemini Analysis (${modelName}):`, analysis);
                    break; // Success, exit loop
                } catch (e: any) {
                    console.warn(`Model ${modelName} failed:`, e.message);
                    if (modelName === modelsToTry[modelsToTry.length - 1]) {
                        throw e; // Throw if last model failed
                    }
                }
            }

            if (analysis.includes('not meaningful')) return 'not meaningful';
            if (analysis.includes('unclear')) return 'unclear';
            if (analysis.includes('meaningful')) return 'meaningful';

            console.warn('Unexpected Gemini response:', analysis);
            // Fall through to heuristics on unexpected response
        } catch (error) {
            console.error('Gemini API error (all models failed):', error);
            // Fall through to heuristics on API error
        }
    } else {
        console.warn('No GEMINI_API_KEY found.');
    }

    // 2. Fallback Heuristics (if API fails or no key)
    if (text.length < 20) return 'unclear';
    if (text.toLowerCase().includes("spam")) return 'not meaningful';

    // Heuristic 1: Gibberish / Keyboard Smash detection
    const nonAlpha = text.replace(/[a-zA-Z0-9\s.,!?'-]/g, '');
    if (nonAlpha.length / text.length > 0.2) return 'not meaningful';

    // Heuristic 2: Repetition
    if (/(.)\1{3,}/.test(text)) return 'not meaningful';

    // Heuristic 3: Lack of spaces
    if (text.length > 30 && !text.includes(' ')) return 'not meaningful';

    return 'meaningful';
}
