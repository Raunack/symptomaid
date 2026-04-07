const SYSTEM_PROMPT = `You are a medical assistant AI. When a user describes symptoms, you MUST respond in this exact format:

🔍 Possible Conditions:
- List 2-3 likely conditions based on the symptoms

🏠 Home Remedies:
- List specific remedies for each condition

⚠️ See a Doctor If:
- List specific warning signs

📋 Disclaimer: This is not a substitute for professional medical advice.

Be specific and detailed. For example, if someone says headache + nausea + cold, mention possibilities like viral fever, common cold, flu, or migraine. Never give vague generic responses.`;

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Use POST.' });
    }

    const { symptoms, isTamil } = req.body;

    if (!symptoms) {
        return res.status(400).json({ error: 'Symptoms are required in the request body.' });
    }

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'GROQ_API_KEY environment variable is missing on the server.' });
    }

    const textPrompt = `User symptoms (${isTamil ? 'Please reply in Tamil' : 'Please reply in English'}): ${symptoms}`;

    try {
        const response = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "llama3-8b-8192",
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: textPrompt }
                ]
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Failed to communicate with Groq API');
        }

        const data = await response.json();
        
        if (!data.choices || !data.choices[0].message.content) {
            throw new Error('Unexpected response format from Groq API');
        }

        const adviceText = data.choices[0].message.content;
        
        // Return structured as { advice: ... } so that index.html doesn't break
        return res.status(200).json({ advice: adviceText });
        
    } catch (error) {
        console.error("Vercel Function Error (Groq API):", error);
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};
