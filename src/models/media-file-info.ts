export interface MediaFileInfo {
  filePath: string;
  fileName: string;
  fileExtension: string;
  supportsExif: boolean;

  jsonFilePath: string|null;
  jsonFileName: string|null;
  jsonFileExists: boolean;
}
