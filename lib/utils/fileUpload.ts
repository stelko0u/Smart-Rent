import fs from 'fs';
import path from 'path';

const ALLOWED = ['image/png', 'image/jpeg'];
const MAX_FILES = 12;

export function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export async function saveCompanyCarImages(
  files: File[],
  companyId: number,
): Promise<string[]> {
  if (files.length > MAX_FILES) {
    throw new Error('TOO_MANY_FILES');
  }

  const uploadDir = path.join(
    process.cwd(),
    'public',
    'uploads',
    'company',
    String(companyId),
  );

  ensureDir(uploadDir);

  const images: string[] = [];

  for (const file of files) {
    if (!file || !file.type || !ALLOWED.includes(file.type)) continue;

    const arrayBuf = await file.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuf);
    const ext = file.type === 'image/png' ? '.png' : '.jpg';
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}${ext}`;

    fs.writeFileSync(path.join(uploadDir, fileName), uint8);
    images.push(`/uploads/company/${companyId}/${fileName}`);
  }

  return images;
}
