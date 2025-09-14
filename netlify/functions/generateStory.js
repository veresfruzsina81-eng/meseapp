import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function handler(event) {
  if(event.httpMethod!=="POST"){ return { statusCode:405, body:"Method Not Allowed" }; }
  try{
    const { childName="A kis hős", favoriteAnimal="nyuszi", theme="" } = JSON.parse(event.body||"{}");
    const system="Te egy magyar gyerekmeséket író szerző vagy. Mindig kedves, életkorbarát stílusban írsz.";
    const user=`Írj egy kb. 500 szavas mesét 5–8 éves gyerekeknek.\nFőhős: ${childName}. Kedvenc állat: ${favoriteAnimal}. Téma: ${theme||'varázslatos kaland'}.\nAz első sor a cím legyen, majd jöjjön a mese. Ne legyen ijesztő vagy erőszakos.`;

    const completion=await client.chat.completions.create({
      model:"gpt-4o-mini",
      messages:[{role:"system",content:system},{role:"user",content:user}],
      temperature:0.85,max_tokens:900
    });
    const story=completion.choices[0].message.content.trim();
    return { statusCode:200, body:JSON.stringify({story}) };
  }catch(err){
    console.error(err);
    return { statusCode:500, body:JSON.stringify({error:err.message}) };
  }
}
