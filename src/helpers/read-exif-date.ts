import { exiftool } from 'exiftool-vendored';

export async function readExifDate(filePath: string): Promise<Date | null> {
  const readResult = await exiftool.read(filePath);
  if (!readResult.DateTimeOriginal) {
    return null;
  }

  if (typeof readResult.DateTimeOriginal === 'string') {
    return new Date(readResult.DateTimeOriginal);
  }

  return readResult.DateTimeOriginal.toDate();
}
