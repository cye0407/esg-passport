// ============================================
// PDF Parser — extract raw text from PDF files
// ============================================

import pdf from 'pdf-parse';

export interface ParsedPage {
  pageNumber: number;
  text: string;
}

export interface ParsedDocument {
  pages: ParsedPage[];
  fullText: string;
  pageCount: number;
  metadata: {
    title?: string;
    author?: string;
    creationDate?: string;
  };
}

/**
 * Extract text content from a PDF buffer.
 * Returns structured per-page text for field extraction.
 */
export async function parsePdf(buffer: Buffer): Promise<ParsedDocument> {
  const data = await pdf(buffer);

  // pdf-parse returns all text concatenated; split by form feeds for pages
  const rawPages = data.text.split('\f').filter((p: string) => p.trim().length > 0);

  const pages: ParsedPage[] = rawPages.map((text: string, i: number) => ({
    pageNumber: i + 1,
    text: text.trim(),
  }));

  return {
    pages,
    fullText: data.text,
    pageCount: data.numpages,
    metadata: {
      title: data.info?.Title || undefined,
      author: data.info?.Author || undefined,
      creationDate: data.info?.CreationDate || undefined,
    },
  };
}
