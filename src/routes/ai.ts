import { Router } from "express";
import { GoogleGenAI } from '@google/genai'

const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY! })

const router = Router()

router.post('/', async (req, res) => {
    const prompt = `You are an expense categorisation system.

The user may enter ONE or MULTIPLE expenses in a single message.
Identify ALL expenses mentioned and return them as a JSON array.

For each expense:
1. Identify the item and amount
2. Match to the best category from provided list
3. Always provide 3-5 suggestions

...existing rules...

Return ONLY a valid JSON array, even for single expenses:
[
  {
    "item": "string",
    "amount": number,
    "isCategoryFound": boolean,
    "confidence": number,
    "category": { "id": "...", "name": "...", "icon": "..." } or null,
    "suggestions": [{"name": "...", "icon": "..."}]
  }
]

Examples:
Input: "tomato 45rs"
Output: [{"item":"Tomato","amount":45,...}]

Input: "bought tomato 45 and water 30 also paid electricity 1200"
Output: [
  {"item":"Tomato","amount":45,...},
  {"item":"Water","amount":30,...},
  {"item":"Electricity Bill","amount":1200,...}
]

User message: ${req.body.message}
Existing categories: ${JSON.stringify(req.body.categories)}
`
    try {
        const response = await genAI.models.generateContent({
            model: process.env.GEMINI_MODEL!,
            contents: prompt,
        })
        const output = response.text ?? ''
        if (!output) {
            return res.status(500).json({ error: 'No response from model' })
        }
        const clean = output.replace(/```json|```/g, '').trim()
        try {
            const parsed = JSON.parse(clean)
            return res.json(parsed)
        } catch {
            return res.status(500).json({ error: 'Failed to parse the response' })
        }
    } catch (err) {
        console.log(err)
        return res.status(500).json({ error: 'Something went wrong' })
    }
})

export default router