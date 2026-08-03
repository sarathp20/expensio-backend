import { Router } from "express";
import { GoogleGenAI } from '@google/genai'

const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY! })

const router = Router()

router.post('/', async (req, res) => {
    const prompt = `You are an expense categorisation system.

Given a user's expense message and a list of existing categories, you must:
1. Identify the item and amount from the message
2. Match the item to the BEST fitting category from the provided list
3. Think broadly when matching — if the item could reasonably belong to a category, it is a match

Item extraction rules:
- Preserve the full item name including adjectives and proper nouns
- "Regular pizza 200rs" → item: "Regular Pizza"
- "Prathiba Dress 1500rs" → item: "Prathiba Dress"
- "bought tomato 45rs" → item: "Tomato" (remove action word "bought" only)
- "paid electricity bill 4500rs" → item: "Electricity Bill" (remove "paid" only)
- Only remove action words like "bought", "paid", "got", "purchased"
- Never remove descriptive words, adjectives, or proper nouns

Matching rules:
- "Tomato" → "Vegetables" or "Groceries" or "Food" = MATCH
- "Netflix" → "Entertainment" or "Subscriptions" = MATCH  
- "Petrol" → "Transport" or "Fuel" or "Vehicle" = MATCH
- Only set isCategoryFound false if NO category is even remotely related
- 80% confidence is enough to match — do not be overly strict

Always provide 3-5 category suggestions in the suggestions array
regardless of whether a category was found or not.
Suggestions should be relevant alternatives for the identified item.
Do not repeat the matched category name in suggestions.

Return ONLY valid JSON, no explanation, no markdown, no backticks:
{
  "item": "string — full item name preserving adjectives and proper nouns",
  "amount": number,
  "isCategoryFound": boolean — true if confidence >= 0.8,
  "confidence": number between 0 and 1,
  "category": {
    "id": "string — exact id from provided categories",
    "name": "string — exact name from provided categories",
    "icon": "string — exact icon from provided categories"
  } or null if not found,
  "suggestions": ["always 3-5 relevant category suggestions in the format of category JSON object with name and icon"]
}

Example 1:
Input: "bought tomato 45rs"
Categories: [{"id":"abc123","name":"Vegetables","icon":"🥦"}]
Output: {"item":"Tomato","amount":45,"isCategoryFound":true,"confidence":0.95,"category":{"id":"abc123","name":"Vegetables","icon":"🥦"},"suggestions":[{"name":"Groceries","icon":"🛒"},{"name":"Food & Dining","icon":"🍽️"},{"name":"Fresh Produce","icon":"🍎"},{"name":"Supermarket","icon":"🏪"}]}

Example 2:
Input: "paid electricity bill 4500rs"
Categories: [{"id":"abc123","name":"Groceries","icon":"🛒"}]
Output: {"item":"Electricity Bill","amount":4500,"isCategoryFound":false,"confidence":0.1,"category":null,"suggestions":[{"name":"Utilities","icon":"💡"},{"name":"Household Bills","icon":"🧾"},{"name":"Electricity","icon":"⚡"},{"name":"Home Expenses","icon":"🏠"}]}

Example 3:
Input: "Regular pizza 200rs"
Categories: []
Output: {"item":"Regular Pizza","amount":200,"isCategoryFound":false,"confidence":0,"category":null,"suggestions":[{"name":"Food & Dining","icon":"🍽️"},{"name":"Restaurants","icon":"🍕"},{"name":"Fast Food","icon":"🍔"},{"name":"Takeaway","icon":"🥡"}]}

Example 4:
Input: "Prathiba Dress 1500rs"
Categories: []
Output: {"item":"Prathiba Dress","amount":1500,"isCategoryFound":false,"confidence":0,"category":null,"suggestions":[{"name":"Shopping","icon":"🛍️"},{"name":"Clothing","icon":"👗"},{"name":"Apparel","icon":"👚"},{"name":"Fashion","icon":"✨"}]}

Do it step by step — identify item preserving full name → check each category → pick best match → always provide suggestions.

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