/**
 * Browser PDF reader — extracts text from PDF files using pdfjs-dist.
 * Shared between ESG Passport and ESG Extract web UIs.
 */

import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export async function readPdfText(file) {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map(item => item.str).join(' ');
    pages.push(text);
  }

  return pages.join('\n\n');
}

/**
 * True when a PDF yielded no usable text layer — i.e. it is a scan or a photo.
 * Two shapes to catch: readPdfText succeeded but the pages held almost nothing,
 * or it threw and a file.text() fallback handed back raw PDF bytes.
 */
export function isUnreadablePdfText(text) {
  const trimmed = (text || '').replace(/\s+/g, ' ').trim();
  if (trimmed.startsWith('%PDF')) return true;
  const letters = trimmed.replace(/[^\p{L}\p{N}]/gu, '');
  return letters.length < 60;
}
