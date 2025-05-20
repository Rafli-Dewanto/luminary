import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { doi, style } = await request.json();

  if (!doi || !style) {
    return NextResponse.json(
      { error: 'DOI and citation style are required' },
      { status: 400 },
    );
  }

  try {
    // Fetch citation data from an external API (e.g., CrossRef or similar)
    const response = await fetch(`https://doi.org/${doi}`, {
      headers: { Accept: 'application/vnd.citationstyles.csl+json' },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch citation data');
    }

    const citationData = await response.json();

    // Generate citation based on the selected style
    const citation = generateCitation(citationData, style);

    return NextResponse.json({ data: citation });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate citation' },
      { status: 500 },
    );
  }
}

function generateCitation(data: any, style: string): string {
  const author = `${data.author[0].family}, ${data.author[0].given}`;
  const year = data.issued['date-parts'][0][0];
  const title = data.title;
  const containerTitle = data['container-title'];
  const doi = data.DOI ? `https://doi.org/${data.DOI}` : '';
  const url = data.URL || doi;

  switch (style) {
    case 'APA':
      return `${author}. (${year}). ${title}. ${containerTitle}. ${doi}`;

    case 'Harvard':
      return `${author}, ${year}, ${title}, ${containerTitle}, DOI: ${doi}`;

    case 'MLA':
      return `${data.author[0].given} ${data.author[0].family}. "${title}." ${containerTitle}, ${year}, ${url}.`;

    case 'Chicago':
      return `${data.author[0].given} ${data.author[0].family}. "${title}." ${containerTitle} (${year}): ${url}.`;

    case 'IEEE':
      return `${author}, "${title}," ${containerTitle}, ${year}. [Online]. Available: ${url}`;

    case 'Vancouver':
      return `${data.author[0].family} ${data.author[0].given}. ${title}. ${containerTitle}. ${year}. Available from: ${url}`;

    case 'Turabian':
      return `${data.author[0].given} ${data.author[0].family}, "${title}." ${containerTitle}, ${year}. ${url}`;

    default:
      return 'Citation style not supported yet.';
  }
}
