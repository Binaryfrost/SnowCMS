/**
 * Converts bytes to megabytes, rounded to 2 decimals
 */

export function bytesToReadableUnits(bytes: number) {
  let amount = bytes / 1048576;
  let unit = 'MB';

  if (amount >= 1024) {
    amount /= 1024;
    unit = 'GB';
  }

  return `${Math.round(amount * 100) / 100} ${unit}`;
}

export async function generateThumbnail(file: File): Promise<Blob> {
  // Target DPR of 2
  const SIZE = 192 * 2;
  const image = await createImageBitmap(file);
  const aspectRatio = image.height / image.width;

  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE * aspectRatio;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  image.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to create thumbnail'));
        return;
      }

      resolve(blob);
    });
  });
}
