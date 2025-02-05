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
                content: "You are a trading guru. Given the following data, provide advice for each stock. Use a bit sarcastic, brutally honest and not fun tone. Use conversation like words. Recommending whether to buy, hold or sell."
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
