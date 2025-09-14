import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function handler(event){
  if(event.httpMethod!=="POST"){ return { statusCode:405, body:"Method Not Allowed" }; }
  try{
    const { prompt = "Gyerekbarát illusztráció" } = JSON.parse(event.body||"{}");
    const img = await client.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "512x512",          // gyorsabb
      // quality: "standard",    // (opcionális)
    });
    const b64 = img.data?.[0]?.b64_json;
    if(!b64) throw new Error("No image");
    return { statusCode:200, body: JSON.stringify({ image: `data:image/png;base64,${b64}` }) };
  }catch(err){
    console.error(err);
    return { statusCode:500, body: JSON.stringify({ error: err.message }) };
  }
}
