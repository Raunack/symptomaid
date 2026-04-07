const SYSTEM_PROMPT = `You are a medical assistant AI. When a user describes symptoms, you MUST respond in this exact format:

🔍 Possible Conditions:
- List 2-3 likely conditions based on the symptoms

🏠 Home Remedies:
- List specific remedies for each condition

⚠️ See a Doctor If:
- List specific warning signs

📋 Disclaimer: This is not a substitute for professional medical advice.

Be specific and detailed. For example, if someone says headache + nausea + cold, mention possibilities like viral fever, common cold, flu, or migraine. Never give vague generic responses.`;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Use POST.' });
    }

    const { symptoms, isTamil } = req.body;

    if (!symptoms) {
        return res.status(400).json({ error: 'Symptoms are required in the request body.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY environment variable is missing on the server.' });
    }

    const textPrompt = `User symptoms (${isTamil ? 'Please reply in Tamil' : 'Please reply in English'}): ${symptoms}`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                system_instruction: { 
                    parts: [{ text: SYSTEM_PROMPT }] 
                },
                contents: [{ 
                    parts: [{ text: textPrompt }] 
                }]
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Failed to communicate with Gemini API');
        }

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0].content.parts[0].text) {
            throw new Error('Unexpected response format from Gemini API');
        }

        const adviceText = data.candidates[0].content.parts[0].text;
        
        return res.status(200).json({ advice: adviceText });
        
    } catch (error) {
        console.error("Vercel Function Error (Gemini API):", error);
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}
