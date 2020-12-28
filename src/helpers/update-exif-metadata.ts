import { exiftool } from 'exiftool-vendored';
import { promises as fs } from 'fs';

export async function updateExifMetadata(filePath: string, timeTaken: Date): Promise<void> {
  await exiftool.write(filePath, {
    AllDates: timeTaken.toISOString(),
  });

  await fs.unlink(`${filePath}_original`); // exiftool will rename the old file to {filename}_original, we can delete that
}
