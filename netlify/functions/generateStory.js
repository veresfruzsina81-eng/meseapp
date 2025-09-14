import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { childName = "A kis hős", favoriteAnimal = "nyuszi", theme = "" } = JSON.parse(event.body || "{}");

    const system = "Te egy magyar gyerekmeséket író szerző vagy. Mindig kedves, életkorbarát stílusban írsz.";
    const user = `Írj egy mesét. Főhős: ${childName}. Kedvenc állat: ${favoriteAnimal}. Téma: ${theme || "varázslatos kaland"}. 
    Legyen pozitív, egyszerű, és a végén tanulság.`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ],
      max_tokens: 600,
      temperature: 0.8
    });

    const story = completion.choices[0].message.content.trim();

    return { statusCode: 200, body: JSON.stringify({ story }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
