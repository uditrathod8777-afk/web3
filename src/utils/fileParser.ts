import { Attachment } from '../types/chat';

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function detectFileType(file: File): Attachment['type'] {
  const mime = file.type.toLowerCase();
  const name = file.name.toLowerCase();

  if (mime.startsWith('image/')) return 'image';
  if (mime.includes('csv') || name.endsWith('.csv')) return 'csv';
  if (mime.includes('pdf') || name.endsWith('.pdf')) return 'pdf';
  if (mime.includes('word') || name.endsWith('.docx') || name.endsWith('.doc')) return 'docx';
  if (
    mime.startsWith('text/') ||
    name.endsWith('.txt') ||
    name.endsWith('.md') ||
    name.endsWith('.json') ||
    name.endsWith('.js') ||
    name.endsWith('.ts') ||
    name.endsWith('.py') ||
    name.endsWith('.html') ||
    name.endsWith('.css')
  ) {
    return 'text';
  }
  return 'other';
}

export async function processUploadedFile(file: File): Promise<Attachment> {
  const fileType = detectFileType(file);
  const id = `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  if (fileType === 'image') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          id,
          name: file.name,
          size: file.size,
          type: 'image',
          mimeType: file.type || 'image/jpeg',
          content: reader.result as string,
          previewUrl: reader.result as string,
        });
      };
      reader.onerror = () => reject(new Error(`Failed to read image file: ${file.name}`));
      reader.readAsDataURL(file);
    });
  }

  // Text, CSV, code, markdown
  if (fileType === 'text' || fileType === 'csv') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const textContent = (reader.result as string) || '';
        resolve({
          id,
          name: file.name,
          size: file.size,
          type: fileType,
          mimeType: file.type || 'text/plain',
          content: textContent,
        });
      };
      reader.onerror = () => reject(new Error(`Failed to read text file: ${file.name}`));
      reader.readAsText(file);
    });
  }

  // PDF or DOCX or generic: extract text or read as text / array buffer
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const raw = reader.result as string;
      // Strip control binary characters for a basic text representation
      let sanitized = '';
      if (typeof raw === 'string') {
        sanitized = raw
          .replace(/[^\x20-\x7E\t\r\n]/g, ' ')
          .replace(/\s{2,}/g, ' ')
          .trim();
      }

      resolve({
        id,
        name: file.name,
        size: file.size,
        type: fileType,
        mimeType: file.type || 'application/octet-stream',
        content:
          sanitized && sanitized.length > 50
            ? `Extracted text from ${file.name} (${formatBytes(file.size)}):\n${sanitized.slice(0, 15000)}`
            : `Document attached: ${file.name} (${formatBytes(file.size)}, type: ${file.type || 'document'}). Analyze context based on filename and user instructions.`,
      });
    };
    reader.onerror = () => {
      resolve({
        id,
        name: file.name,
        size: file.size,
        type: fileType,
        mimeType: file.type || 'application/octet-stream',
        content: `Attached file: ${file.name} (${formatBytes(file.size)})`,
      });
    };
    reader.readAsText(file);
  });
}
