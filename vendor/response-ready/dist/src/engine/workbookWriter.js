// ============================================
// ResponseReady — Workbook Writer
// ============================================
// Puts answers into the buyer's ORIGINAL workbook and hands it back with nothing else
// changed. The product promise is "your file in, your file out", and the only way to
// keep it is to touch the answer cells and nothing around them: the zip is opened, the
// one sheet part that holds the targets is edited element by element, and every other
// part is passed through byte for byte.
//
// Measured before this existed (esg-passport DESIGN-original-workbook-and-reuse.md,
// section 0): loading and re-saving the same form through a spreadsheet library rewrote
// ten of the zip's parts — styles, document properties, relationships, both sheets — and
// would drop charts and pivots it does not understand. This writer rewrites one.
//
// Rules, none negotiable:
//   - a cell holding a formula is never written; the caller is told
//   - a cell that already holds content is never written unless the caller says so
//   - strings go in as inline strings, so the shared-string table is not rewritten
//   - the cell's style index is kept, so the buyer's box keeps its shading and border
//   - when the workbook contains any formula, Excel is told to recalculate on open,
//     otherwise a buyer-side "=IF(F11="","OPEN","RECEIVED")" shows its stale value
//
// The XML is parsed and serialised with a DOM, never edited as text: attribute order and
// namespace prefixes differ between the programs that write these files.
import JSZip from 'jszip';
const MAIN_NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const REL_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const CELL_REF = /^([A-Z]{1,3})(\d{1,7})$/;
const XML_PROLOG = /^<\?xml[^>]*\?>\s*/;
function defaultDom() {
    const g = globalThis;
    if (!g.DOMParser || !g.XMLSerializer) {
        throw new Error('No DOMParser/XMLSerializer available; pass options.dom.');
    }
    return { DOMParser: g.DOMParser, XMLSerializer: g.XMLSerializer };
}
function colToNum(col) {
    let n = 0;
    for (const ch of col)
        n = n * 26 + (ch.charCodeAt(0) - 64);
    return n;
}
function childrenNamed(parent, localName) {
    const out = [];
    for (let i = 0; i < parent.childNodes.length; i++) {
        const node = parent.childNodes[i];
        if (node.nodeType === 1 && node.localName === localName)
            out.push(node);
    }
    return out;
}
function firstNamed(parent, localName) {
    const all = parent.getElementsByTagNameNS('*', localName);
    return all.length > 0 ? all[0] : null;
}
function attr(el, localName, ns) {
    // Attributes may carry a prefix ("r:id") or a default namespace; match by local name.
    for (let i = 0; i < el.attributes.length; i++) {
        const a = el.attributes[i];
        if (a.localName === localName && (!ns || a.namespaceURI === ns || a.namespaceURI === null))
            return a.value;
    }
    return null;
}
/** Resolve a sheet's name to its zip part path via workbook.xml and its rels. */
function resolveSheetParts(workbookXml, relsXml) {
    const relTargets = new Map();
    const rels = relsXml.getElementsByTagNameNS('*', 'Relationship');
    for (let i = 0; i < rels.length; i++) {
        const id = attr(rels[i], 'Id');
        const target = attr(rels[i], 'Target');
        if (id && target)
            relTargets.set(id, target);
    }
    const parts = new Map();
    const sheets = workbookXml.getElementsByTagNameNS('*', 'sheet');
    for (let i = 0; i < sheets.length; i++) {
        const name = attr(sheets[i], 'name');
        const rId = attr(sheets[i], 'id', REL_NS);
        const target = rId ? relTargets.get(rId) : undefined;
        if (!name || !target)
            continue;
        parts.set(name, target.startsWith('/') ? target.slice(1) : `xl/${target}`);
    }
    return parts;
}
function serialize(doc, ctx) {
    const out = ctx.serializer.serializeToString(doc);
    // Browsers drop the XML declaration on serialisation; put the original one back.
    return XML_PROLOG.test(out) ? out : ctx.prolog + out;
}
function findOrCreateRow(sheetData, rowNum, doc) {
    const rows = childrenNamed(sheetData, 'row');
    let before = null;
    for (const row of rows) {
        const r = Number(attr(row, 'r'));
        if (r === rowNum)
            return row;
        if (r > rowNum) {
            before = row;
            break;
        }
    }
    const row = doc.createElementNS(MAIN_NS, 'row');
    row.setAttribute('r', String(rowNum));
    sheetData.insertBefore(row, before);
    return row;
}
function findOrCreateCell(row, ref, colNum, doc) {
    const cells = childrenNamed(row, 'c');
    let before = null;
    for (const c of cells) {
        const r = attr(c, 'r') || '';
        if (r === ref)
            return { cell: c, existed: true };
        const m = r.match(CELL_REF);
        if (m && colToNum(m[1]) > colNum) {
            before = c;
            break;
        }
    }
    const cell = doc.createElementNS(MAIN_NS, 'c');
    cell.setAttribute('r', ref);
    row.insertBefore(cell, before);
    return { cell, existed: false };
}
function cellHasFormula(cell) {
    return childrenNamed(cell, 'f').length > 0;
}
function cellHasContent(cell) {
    const v = childrenNamed(cell, 'v')[0];
    if (v && (v.textContent || '').trim() !== '')
        return true;
    const is = childrenNamed(cell, 'is')[0];
    if (is && (is.textContent || '').trim() !== '')
        return true;
    return false;
}
function setCellValue(cell, value, doc) {
    // Drop the old type and content, keep the style (s) and the reference (r).
    cell.removeAttribute('t');
    while (cell.firstChild)
        cell.removeChild(cell.firstChild);
    if (typeof value === 'number') {
        const v = doc.createElementNS(MAIN_NS, 'v');
        v.appendChild(doc.createTextNode(String(value)));
        cell.appendChild(v);
        return;
    }
    if (typeof value === 'boolean') {
        cell.setAttribute('t', 'b');
        const v = doc.createElementNS(MAIN_NS, 'v');
        v.appendChild(doc.createTextNode(value ? '1' : '0'));
        cell.appendChild(v);
        return;
    }
    cell.setAttribute('t', 'inlineStr');
    const is = doc.createElementNS(MAIN_NS, 'is');
    const t = doc.createElementNS(MAIN_NS, 't');
    if (/^\s|\s$|\n/.test(value))
        t.setAttribute('xml:space', 'preserve');
    t.appendChild(doc.createTextNode(value));
    is.appendChild(t);
    cell.appendChild(is);
}
function anyFormulaIn(sheetXmls) {
    // A presence check on raw text is enough here; nothing is edited by it.
    return sheetXmls.some(xml => /<(?:[\w-]+:)?f[\s>]/.test(xml));
}
function ensureRecalcOnOpen(workbookXml) {
    const root = workbookXml.documentElement;
    let calcPr = firstNamed(root, 'calcPr');
    if (!calcPr) {
        calcPr = workbookXml.createElementNS(root.namespaceURI || MAIN_NS, 'calcPr');
        root.appendChild(calcPr);
    }
    if (calcPr.getAttribute('fullCalcOnLoad') === '1')
        return false;
    calcPr.setAttribute('fullCalcOnLoad', '1');
    return true;
}
/**
 * Write answers into the workbook and return the new bytes plus a report of what was
 * written, what was refused and why, and which zip parts changed.
 */
export async function writeAnswersIntoWorkbook(original, writes, options = {}) {
    const dom = options.dom ?? defaultDom();
    const parser = new dom.DOMParser();
    const serializer = new dom.XMLSerializer();
    const parseXml = (text) => parser.parseFromString(text, 'application/xml');
    const zip = await JSZip.loadAsync(original);
    const readPart = async (path) => {
        const file = zip.file(path);
        if (!file)
            throw new Error(`Workbook part missing: ${path}`);
        return file.async('string');
    };
    const workbookText = await readPart('xl/workbook.xml');
    const relsText = await readPart('xl/_rels/workbook.xml.rels');
    const workbookDoc = parseXml(workbookText);
    const sheetParts = resolveSheetParts(workbookDoc, parseXml(relsText));
    const written = [];
    const refused = [];
    const touched = new Set();
    // Group targets by sheet so each part is parsed and serialised once.
    const bySheet = new Map();
    for (const w of writes) {
        const m = w.cell.toUpperCase().match(CELL_REF);
        if (!m) {
            refused.push({ target: w, reason: 'bad-cell' });
            continue;
        }
        if (!sheetParts.has(w.sheet)) {
            refused.push({ target: w, reason: 'sheet-not-found' });
            continue;
        }
        (bySheet.get(w.sheet) ?? bySheet.set(w.sheet, []).get(w.sheet)).push({ ...w, cell: w.cell.toUpperCase() });
    }
    for (const [sheet, targets] of bySheet) {
        const path = sheetParts.get(sheet);
        const text = await readPart(path);
        const doc = parseXml(text);
        const sheetData = firstNamed(doc, 'sheetData');
        if (!sheetData) {
            for (const t of targets)
                refused.push({ target: t, reason: 'bad-cell' });
            continue;
        }
        let changed = false;
        for (const t of targets) {
            const m = t.cell.match(CELL_REF);
            const rowNum = Number(m[2]);
            const row = findOrCreateRow(sheetData, rowNum, doc);
            const { cell, existed } = findOrCreateCell(row, t.cell, colToNum(m[1]), doc);
            if (existed && cellHasFormula(cell)) {
                refused.push({ target: t, reason: 'formula' });
                continue;
            }
            if (existed && cellHasContent(cell) && !t.overwrite) {
                refused.push({ target: t, reason: 'non-empty' });
                continue;
            }
            setCellValue(cell, t.value, doc);
            written.push(t);
            changed = true;
        }
        if (changed) {
            const prolog = (text.match(XML_PROLOG) || [''])[0];
            zip.file(path, serialize(doc, { serializer, prolog }));
            touched.add(path);
        }
    }
    // Formulas anywhere in the workbook may read the cells just written; their cached
    // values are now stale, so Excel must recalculate when it opens the file.
    let recalcOnOpen = false;
    if (written.length > 0) {
        const sheetXmls = await Promise.all([...sheetParts.values()].map(p => zip.file(p)?.async('string') ?? Promise.resolve('')));
        if (anyFormulaIn(sheetXmls)) {
            recalcOnOpen = true;
            if (ensureRecalcOnOpen(workbookDoc)) {
                const prolog = (workbookText.match(XML_PROLOG) || [''])[0];
                zip.file('xl/workbook.xml', serialize(workbookDoc, { serializer, prolog }));
                touched.add('xl/workbook.xml');
            }
        }
    }
    const bytes = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
    return { bytes, report: { written, refused, touchedParts: [...touched], recalcOnOpen } };
}
/** "<name> - completed <YYYY-MM-DD>.xlsx": never the buyer's file name, so theirs survives. */
export function completedFileName(originalName, date = new Date()) {
    const stem = originalName.replace(/\.(xlsx|xlsm|xls)$/i, '');
    const ext = (originalName.match(/\.(xlsx|xlsm)$/i) || ['.xlsx'])[0].toLowerCase();
    return `${stem} - completed ${date.toISOString().slice(0, 10)}${ext}`;
}
//# sourceMappingURL=workbookWriter.js.map