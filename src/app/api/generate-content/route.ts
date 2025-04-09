import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { context, query } = body;

    if (!context || !query) {
      return NextResponse.json(
        { error: "Missing required fields: context and query" },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
### Context:
${context}

### User Query:
${query}

### Instructions:
- Respond in Markdown format.
- Keep the response concise.
`;

    const result = await model.generateContent([prompt]);
    const text = result.response.text();

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Error generating content:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
