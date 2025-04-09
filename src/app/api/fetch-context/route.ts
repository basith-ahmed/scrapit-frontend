// app/api/fetch-context/route.ts

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "Missing URL parameter" },
      { status: 400 }
    );
  }

  const fetchFrom = `http://34.100.177.80/context?url=${encodeURIComponent(
    url
  )}`;

  try {
    const response = await fetch(fetchFrom);
    const context = await response.text();

    return NextResponse.json({ context });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch context" },
      { status: 500 }
    );
  }
}
