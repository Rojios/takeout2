import { existsSync } from 'fs';
import { basename, extname, resolve } from 'path';
import { MediaFileInfo } from '../models/media-file-info';
import { SUPPORTED_MEDIA_FILE_EXTENSIONS } from '../models/supported-media-file-extensions';
// import { doesFileSupportExif } from './does-file-support-exif';
import { getAllFilesRecursively } from './get-all-files-recursively';
import { getCompanionJsonPathForMediaFile } from './get-companion-json-path-for-media-file';

export async function findSupportedMediaFiles(directory: string): Promise<MediaFileInfo[]> {
  const allFiles = await getAllFilesRecursively(directory);
  const dirIsEmpty = allFiles.length === 0;
  if (dirIsEmpty) {
    throw new Error('The search directory is empty, so there is no work to do. Check that your --inputDir contains all of the Google Takeout data, and that any zips have been extracted before running this tool');
  }

  const mediaFiles: MediaFileInfo[] = [];

  for (const filePath of allFiles) {
    const fileExtension = extname(filePath).toLowerCase();
    if (SUPPORTED_MEDIA_FILE_EXTENSIONS.includes(fileExtension)) {
      const fileName = basename(filePath);
      const supportsExif = fileExtension === '.jpg' || fileExtension === '.jpeg';

      const jsonFilePath = getCompanionJsonPathForMediaFile(filePath);
      const jsonFileName = jsonFilePath ? basename(jsonFilePath) : null;
      const jsonFileExists = jsonFilePath ? existsSync(jsonFilePath) : false;

      mediaFiles.push({
        filePath,
        fileName,
        fileExtension,
        supportsExif,
        jsonFilePath,
        jsonFileName,
        jsonFileExists,
      });
    }

  }

  return mediaFiles;
}
