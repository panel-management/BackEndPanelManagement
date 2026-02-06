import { join } from 'path';
import * as fs from 'fs';

export class fileUtils {
  static deleteFile(imageUrl: string | null | undefined): void {
    if (!imageUrl) return;

    try {
      const urlObj = new URL(imageUrl);
      const relativePath = decodeURIComponent(urlObj.pathname);
      const fullPath = join(process.cwd(), relativePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch (error) {
      console.error(`Error (Delete) Image: ${error.message}`);
    }
  }

  static createImageUrl(filename: string, folder: string): string {
    const baseUrl = process.env.APP_URL?.endsWith('/')
      ? process.env.APP_URL
      : `${process.env.APP_URL}/`;

    return `${baseUrl}uploads/${folder}/${filename}`;
  }
}
