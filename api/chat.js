module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { symptoms } = req.body;

    const systemPrompt = "You are a medical assistant. Analyze symptoms and give basic advice.";

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama3-70b-8192",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: symptoms }
          ]
        })
      }
    );

    const data = await response.json();

    const text =
      data.choices?.[0]?.message?.content || "No response generated";

    res.status(200).json({ advice: text });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};
