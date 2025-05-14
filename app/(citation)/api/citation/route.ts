import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { doi, style } = await request.json();

  if (!doi || !style) {
    return NextResponse.json(
      { error: "DOI and citation style are required" },
      { status: 400 }
    );
  }

  try {
    // Fetch citation data from an external API (e.g., CrossRef or similar)
    const response = await fetch(`https://doi.org/${doi}`, {
      headers: { Accept: "application/vnd.citationstyles.csl+json" },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch citation data");
    }

    const citationData = await response.json();

    // Generate citation based on the selected style
    const citation = generateCitation(citationData, style);

    return NextResponse.json({ citation });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate citation" },
      { status: 500 }
    );
  }
}

function generateCitation(data: any, style: string): string {
  switch (style) {
    case "APA":
      return `${data.author[0].family}, ${data.author[0].given}. (${data.issued["date-parts"][0][0]}). ${data.title}. ${data["container-title"]}. https://doi.org/${data.DOI}`;
    case "Harvard":
      return `${data.author[0].family}, ${data.author[0].given}, ${data.issued["date-parts"][0][0]}, ${data.title}, ${data["container-title"]}, DOI: https://doi.org/${data.DOI}`;
    default:
      return "Citation style not supported yet.";
  }
}
