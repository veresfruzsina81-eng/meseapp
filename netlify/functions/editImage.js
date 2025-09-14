import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { prompt = "Gyerekbarát illusztráció", imageDataUrl } = JSON.parse(event.body || "{}");
    if (!imageDataUrl) throw new Error("imageDataUrl hiányzik");

    // dataURL -> base64
    const b64 = imageDataUrl.split(",")[1];

    // ⚡ Új API: generate image-to-image módban
    const resp = await client.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024",
      image: [{ b64_json: b64 }]   // az input kép
    });

    const out = resp.data?.[0]?.b64_json;
    if (!out) throw new Error("No edited image");

    return { statusCode: 200, body: JSON.stringify({ image: `data:image/png;base64,${out}` }) };
  } catch (err) {
    console.error("editImage error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
