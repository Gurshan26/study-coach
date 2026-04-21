import pdf from 'pdf-parse';

const SUPPORTED_EXTENSIONS = ['.pdf', '.txt', '.md'];

function getExtension(fileName = '') {
  const idx = fileName.lastIndexOf('.');
  return idx === -1 ? '' : fileName.slice(idx).toLowerCase();
}

function countWords(text = '') {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function groupTextByLine(items) {
  const grouped = new Map();
  for (const item of items) {
    if (!item.str || !item.str.trim()) {
      continue;
    }
    const y = Math.round(item.transform?.[5] || 0);
    const key = String(y);
    const existing = grouped.get(key) || [];
    existing.push({
      text: item.str.trim(),
      x: item.transform?.[4] || 0
    });
    grouped.set(key, existing);
  }

  return [...grouped.entries()]
    .sort((a, b) => Number(b[0]) - Number(a[0]))
    .map(([, lineItems]) =>
      lineItems
        .sort((a, b) => a.x - b.x)
        .map((entry) => entry.text)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
    )
    .filter(Boolean);
}

function stripHeaderFooter(lines) {
  if (lines.length <= 2) {
    return lines;
  }

  const top = lines[0].split(/\s+/).length;
  const bottom = lines[lines.length - 1].split(/\s+/).length;
  const trimmed = [...lines];

  if (top < 4) {
    trimmed.shift();
  }
  if (trimmed.length > 0 && bottom < 4) {
    trimmed.pop();
  }

  return trimmed;
}

async function parsePdfBuffer(buffer) {
  try {
    const pages = [];
    const data = await pdf(buffer, {
      pagerender: async (pageData) => {
        const textContent = await pageData.getTextContent();
        const lines = groupTextByLine(textContent.items);
        const cleaned = stripHeaderFooter(lines).join('\n');
        pages.push(cleaned);
        return cleaned;
      }
    });

    const text = pages.filter(Boolean).join('\n\n').trim() || data.text.trim();
    if (!text) {
      const err = new Error('No extractable text found in PDF. The file may be scanned images only.');
      err.status = 422;
      throw err;
    }

    return {
      text,
      pageCount: data.numpages || pages.length || 1,
      wordCount: countWords(text)
    };
  } catch (error) {
    const raw = buffer.toString('latin1');
    const extractedChunks = [];
    const regex = /\(([^()]*)\)\s*Tj/g;
    let match = regex.exec(raw);
    while (match) {
      extractedChunks.push(
        match[1]
          .replace(/\\\(/g, '(')
          .replace(/\\\)/g, ')')
          .replace(/\\\\/g, '\\')
      );
      match = regex.exec(raw);
    }

    const fallbackText = extractedChunks.join('\n').trim();
    if (countWords(fallbackText) > 15) {
      const pageCount = (raw.match(/\/Type\s*\/Page\b/g) || []).length || 1;
      return {
        text: fallbackText,
        pageCount,
        wordCount: countWords(fallbackText)
      };
    }

    const message = String(error?.message || '').toLowerCase();
    const friendlyError = new Error(
      message.includes('password') || message.includes('encrypted')
        ? 'Unable to parse PDF: file appears password-protected.'
        : 'Unable to parse PDF: file is corrupted or unreadable.'
    );
    friendlyError.status = 422;
    throw friendlyError;
  }
}

export async function parseUploadedFile(file) {
  if (!file || !file.buffer || !file.originalname) {
    const err = new Error('No file uploaded.');
    err.status = 400;
    throw err;
  }

  const extension = getExtension(file.originalname);
  if (!SUPPORTED_EXTENSIONS.includes(extension)) {
    const err = new Error('Unsupported file type. Allowed: .pdf, .txt, .md');
    err.status = 400;
    throw err;
  }

  if (extension === '.pdf') {
    return parsePdfBuffer(file.buffer);
  }

  const text = file.buffer.toString('utf-8').trim();
  if (!text) {
    const err = new Error('Uploaded file is empty.');
    err.status = 422;
    throw err;
  }

  return {
    text,
    pageCount: 1,
    wordCount: countWords(text)
  };
}
