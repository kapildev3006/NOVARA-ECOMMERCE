import { NextResponse } from "next/server";
import { GoogleGenAI, Type, Schema } from "@google/genai";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI generation is temporarily unavailable (Missing API Key)." },
        { status: 503 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const body = await req.json();
    const { prompt, targetPrice, brandStyle, additionalInstructions, validCategories } = body;
    
    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json({ error: "Product idea prompt is required." }, { status: 400 });
    }
    
    if (prompt.length > 2000) {
      return NextResponse.json({ error: "Prompt is too long. Please keep it under 2000 characters." }, { status: 400 });
    }

    if (!validCategories || !Array.isArray(validCategories) || validCategories.length === 0) {
      return NextResponse.json({ error: "Valid categories list is missing." }, { status: 400 });
    }

    const categoryNames = validCategories.map((c: { name: string }) => c.name);

    const productSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "A concise, clear ecommerce product name" },
        slug: { type: Type.STRING, description: "URL-friendly slug generated from the name" },
        category: { type: Type.STRING, description: `Must be exactly one of: ${categoryNames.join(", ")}` },
        description: { type: Type.STRING, description: "Detailed, engaging ecommerce description. No markdown formatting." },
        price: { type: Type.NUMBER, description: "Current selling price in INR" },
        originalPrice: { type: Type.NUMBER, description: "Original MRP in INR (must be >= price)" },
        discount: { type: Type.NUMBER, description: "Discount percentage (0-100)" },
        stock: { type: Type.INTEGER, description: "Inventory count (0 or higher)" },
        specifications: {
          type: Type.OBJECT,
          description: "Technical specifications. Use Title Case for keys. Values must be strings."
        },
        isNew: { type: Type.BOOLEAN, description: "Whether this is a new arrival" },
        isBestSeller: { type: Type.BOOLEAN, description: "Whether this is a best seller" }
      },
      required: ["name", "slug", "category", "description", "price", "originalPrice", "discount", "stock", "specifications", "isNew", "isBestSeller"]
    };

    const systemPrompt = `You are an ecommerce product catalog assistant for NOVARA.
Rules:
- Return ONLY the requested structured JSON fields.
- Do not invent brand claims that were not provided.
- Do not invent certifications or fabricated highly specific technical claims.
- Keep descriptions concise and ecommerce-friendly.
- Use INR-compatible numeric prices.
- Respect the supplied category list EXACTLY.
- Do not produce HTML or markdown.
- For missing info, use reasonable generic values only where safe.

User Prompt: ${prompt}
${targetPrice ? `Target Price Constraint: ${targetPrice}` : ""}
${brandStyle ? `Brand/Style Context: ${brandStyle}` : ""}
${additionalInstructions ? `Additional Instructions: ${additionalInstructions}` : ""}
`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: systemPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: productSchema,
      }
    });

    const textOutput = response.text;
    if (!textOutput) {
      return NextResponse.json({ error: "Received empty response from AI." }, { status: 500 });
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(textOutput);
    } catch {
      return NextResponse.json({ error: "Received malformed JSON from AI." }, { status: 500 });
    }

    // Validation
    if (!parsedResult.name) return NextResponse.json({ error: "Missing name." }, { status: 422 });
    if (!parsedResult.description) return NextResponse.json({ error: "Missing description." }, { status: 422 });
    if (parsedResult.price <= 0) return NextResponse.json({ error: "Invalid price." }, { status: 422 });
    if (parsedResult.originalPrice < parsedResult.price) return NextResponse.json({ error: "Original price must be >= price." }, { status: 422 });
    if (parsedResult.discount < 0 || parsedResult.discount > 100) return NextResponse.json({ error: "Invalid discount." }, { status: 422 });
    if (parsedResult.stock < 0 || !Number.isInteger(parsedResult.stock)) return NextResponse.json({ error: "Invalid stock." }, { status: 422 });
    
    if (!categoryNames.includes(parsedResult.category)) {
      return NextResponse.json({ error: `AI generated an invalid category: ${parsedResult.category}` }, { status: 422 });
    }

    return NextResponse.json(parsedResult);
  } catch (error: unknown) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { error: "AI generation failed or timed out. Please try again later." },
      { status: 500 }
    );
  }
}
