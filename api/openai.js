import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed, use POST." });
  }

  // Extract prompt from body
  const { prompt } = req.body || {};
  if (!prompt) {
    return res.status(400).json({ error: "No prompt provided." });
  }

  // Initialize the new OpenAI client
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // set in Vercel env vars
  });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content:"You are a seasoned trading expert with a no-nonsense approach. Analyze the provided stock data and deliver brutally honest, slightly sarcastic, and serious advice. Speak in a conversational yet authoritative tone, making it clear whether to buy, hold, or sell—no sugarcoating."
            },
            {
                role: "user",
                content: prompt
            }],
    });

      const completionText = response.choices?.[0]?.message?.content?.trim() || "No response";
      return res.status(200).json({ completion: completionText });
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return res.status(500).json({ error: "Error calling OpenAI API." });
  }
}

