import { promises as fs } from 'fs';
import { GoogleMetadata } from '../models/google-metadata';
import { MediaFileInfo } from '../models/media-file-info';

export async function readPhotoTakenTimeFromGoogleJson(mediaFile: MediaFileInfo): Promise<Date|null> {
  if (!mediaFile.jsonFilePath || !mediaFile.jsonFileExists) {
    return null;
  }

  const jsonContents = await fs.readFile(mediaFile.jsonFilePath, 'utf8');
  const googleJsonMetadata = JSON.parse(jsonContents) as GoogleMetadata;

  if (!googleJsonMetadata?.photoTakenTime?.timestamp) {
    return null;
  }

  const photoTakenTimestamp = parseInt(googleJsonMetadata.photoTakenTime.timestamp, 10);
  return new Date(photoTakenTimestamp * 1000);
}
