module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const symptoms = req.body?.symptoms?.trim();

    if (!symptoms) {
      return res.status(400).json({ error: "Symptoms are required" });
    }

    const systemPrompt = `
You are a basic medical symptom assistant.
Give a short, safe, non-diagnostic response.

Return in this format:
1. Possible common reasons
2. Self-care advice
3. Red flags for urgent medical help
4. A short disclaimer that this is not a diagnosis

Do not claim certainty.
Do not prescribe medicines aggressively.
`;

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: symptoms }
        ],
        temperature: 0.4
      })
    });

    const data = await groqResponse.json();

    if (!groqResponse.ok) {
      console.error("Groq API error:", data);
      return res.status(groqResponse.status).json({
        error: data?.error?.message || "Groq request failed"
      });
    }

    const advice = data?.choices?.[0]?.message?.content;

    if (!advice || typeof advice !== "string") {
      console.error("Unexpected Groq response:", data);
      return res.status(500).json({ error: "Invalid AI response format" });
    }

    return res.status(200).json({ advice });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
