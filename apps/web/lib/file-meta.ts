/**
 * The bits of a chosen file the upload chip displays: a size and a page count.
 *
 * Both are derived in the browser, before anything is sent anywhere, because
 * the chip appears as soon as a file is picked — long before the API has seen
 * it and could report page counts of its own.
 */

/** Matches the "2MB" / "8MB" style in the design — whole units, no decimals. */
export function formatFileSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${Math.round(mb)}MB`;
  return `${Math.max(1, Math.round(bytes / 1024))}KB`;
}

/**
 * Page count for a chosen file.
 *
 * Images are a single page. For a PDF this reads the page tree's `/Count`
 * entry, which is a heuristic rather than a parse: it is right for ordinary
 * PDFs, but a file whose catalogue lives inside a compressed object stream
 * hides `/Count` from a byte scan. That is why the return type is nullable —
 * the caller drops the page segment rather than printing a wrong number.
 *
 * Pulling in a real PDF parser for one label was not worth ~300KB of JS.
 */
export async function countPages(file: File): Promise<number | null> {
  if (file.type !== 'application/pdf') return 1;

  try {
    // latin1 keeps every byte a single code unit, so offsets stay meaningful
    // and no byte sequence is mangled into a replacement character.
    const text = new TextDecoder('latin1').decode(await file.arrayBuffer());

    // Nested /Pages nodes each declare their own subtree count, so the root —
    // the total — is the largest.
    const counts = [...text.matchAll(/\/Count\s+(\d+)/g)].map((m) => Number(m[1]));
    if (counts.length > 0) {
      const max = Math.max(...counts);
      if (Number.isFinite(max) && max > 0) return max;
    }

    // Fallback: count page objects directly. `[^s]` avoids matching /Pages.
    const pageObjects = text.match(/\/Type\s*\/Page[^s]/g);
    return pageObjects === null ? null : pageObjects.length;
  } catch {
    return null;
  }
}

/** "2MB • 2 Pages", or just "2MB" when the page count could not be read. */
export function formatFileMeta(bytes: number, pages: number | null): string {
  const size = formatFileSize(bytes);
  if (pages === null) return size;
  return `${size}  •  ${pages} ${pages === 1 ? 'Page' : 'Pages'}`;
}
