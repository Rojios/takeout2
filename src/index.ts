import { Command, flags } from '@oclif/command';
import * as Parser from '@oclif/parser';
import { existsSync } from 'fs';
import { readExifDate } from './helpers/read-exif-date';
import { findSupportedMediaFiles } from './helpers/find-supported-media-files';
import { readPhotoTakenTimeFromGoogleJson } from './helpers/read-photo-taken-time-from-google-json';
import { updateExifMetadata } from './helpers/update-exif-metadata';
import { updateFileModificationDate } from './helpers/update-file-modification-date';
import { SUPPORTED_MEDIA_FILE_EXTENSIONS } from './models/supported-media-file-extensions';
import { MediaFileInfo } from './models/media-file-info';

class GooglePhotosTakeoutDateFixer extends Command {
  static description = `Takes in a directory path for an extracted Google Photos Takeout.
    All files will have their modified timestamp set to match the timestamp specified in Google's JSON metadata files (where present) or from their EXIF metadata.
    In addition, for file types that support EXIF, the EXIF "DateTimeOriginal" field will be set to the timestamp from Google's JSON metadata, if the field is not already set in the EXIF metadata.`;

  static flags = {
    verbose: flags.boolean({description: 'Log more information.'}),
    version: flags.version({name: 'version'}),
    help: flags.help({char: 'h'}),
  }

  static args: Parser.args.Input = [{
    name: 'directory',
    description: 'Directory containing the extracted contents of Google Photos Takeout zip file',
    required: true,
  }]

  async run() {
    const { args, flags } = this.parse(GooglePhotosTakeoutDateFixer);

    try {
      if (!args.directory || !existsSync(args.directory)) {
        throw new Error('The takeout directory must exist');
      }
      await this.processMediaFiles(args.directory, flags.verbose);
    } catch (error) {
      this.error(error);
    }

    this.log('Done 🎉');
    this.exit(0);
  }

  private async processMediaFiles(directory: string, verbose: boolean): Promise<void> {
    this.log(`--- Finding supported media files (${SUPPORTED_MEDIA_FILE_EXTENSIONS.join(', ')}) ---`)
    const mediaFiles = await findSupportedMediaFiles(directory);

    this.logFileCounts(mediaFiles);

    this.log(`--- Processing media files ---`);

    for (const mediaFile of mediaFiles) {
      // Process the output file, setting the modified timestamp and/or EXIF metadata where necessary
      const jsonDate = await readPhotoTakenTimeFromGoogleJson(mediaFile);
      const exifDate = await readExifDate(mediaFile.filePath);

      await this.updateFileDates(mediaFile, jsonDate, exifDate, verbose);
    }

    // Log a summary
    this.log(`--- Processed all media files. ---`);
  }

  private logFileCounts(mediaFiles: MediaFileInfo[]) {
    const fileCounts = mediaFiles.reduce((counts, mediaFile) => {
      let extension = mediaFile.fileExtension;
      if (extension === '.jpeg') {
        extension = '.jpg';
      }

      const count = counts.get(extension) || 0;
      counts.set(extension, count + 1);

      return counts;
    }, new Map<string, number>());

    for (const [extension, fileCount] of fileCounts) {
      this.log(`Found ${fileCount} ${extension} files`);
    }
  }

  private async updateFileDates(mediaFile: MediaFileInfo, jsonDate: Date | null, exifDate: any, verbose: boolean) {
    if (jsonDate && !exifDate) {
      await updateExifMetadata(mediaFile.filePath, jsonDate);
      if (verbose) {
        this.log(`Wrote EXIF dates to: ${mediaFile.filePath}`);
      }
    }

    const timeTaken = jsonDate ?? exifDate;
    if (timeTaken) {
      await updateFileModificationDate(mediaFile.filePath, timeTaken);
      if (verbose) {
        this.log(`Updated file modification date: ${mediaFile.filePath}`);
      }
    } else {
      this.warn(`No date found for file ${mediaFile.filePath}`)
    }
  }
}

export = GooglePhotosTakeoutDateFixer
