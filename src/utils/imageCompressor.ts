/**
 * Memproses gambar soal atau ilustrasi:
 * - JANGAN CROP: Mempertahankan seluruh area gambar dan rasio aspek asli (100% uncropped).
 * - JANGAN KOMPRES: Mempertahankan ketajaman teks/soal tanpa kompresi buram (lossless PNG atau kualitas tinggi).
 * - Sesuaikan dimensi piksel secara proporsional hanya jika gambar melampaui batas aman penyimpanan Firestore (1MB).
 */
export async function processImageWithoutCrop(
  fileOrDataUrl: File | string,
  maxDimension = 1500
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Jika ukuran file asli sudah aman (di bawah 650KB), baca langsung tanpa canvas re-encoding sama sekali
    if (fileOrDataUrl instanceof File && fileOrDataUrl.size <= 650 * 1024) {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(fileOrDataUrl);
      return;
    }

    const processSrc = (src: string, originalMime?: string) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Jika resolusi dan ukuran data sudah aman, gunakan data asli tanpa perubahan
        if (width <= maxDimension && height <= maxDimension && src.length <= 750 * 1024) {
          resolve(src);
          return;
        }

        // Sesuaikan ukuran tanpa mengubah rasio dan TANPA CROP
        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(src);
          return;
        }

        // Render dengan kualitas tertinggi (anti-aliasing halus)
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Jika format aslinya PNG, pertahankan PNG (lossless, tanpa kompresi artefak)
        const isPng = originalMime === 'image/png' || src.startsWith('data:image/png');
        const outputMime = isPng ? 'image/png' : 'image/jpeg';
        let outputData = canvas.toDataURL(outputMime, 0.95);

        // Jika file PNG masih terlalu besar untuk batas 1MB Firestore, skala ulang resolusinya secara proporsional
        if (outputData.length > 750 * 1024) {
          const secondRatio = Math.sqrt((680 * 1024) / outputData.length);
          const scaledW = Math.round(width * secondRatio);
          const scaledH = Math.round(height * secondRatio);
          canvas.width = scaledW;
          canvas.height = scaledH;
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, scaledW, scaledH);
          outputData = canvas.toDataURL(outputMime, 0.95);
        }

        resolve(outputData);
      };

      img.onerror = reject;
      img.src = src;
    };

    if (typeof fileOrDataUrl === 'string') {
      processSrc(fileOrDataUrl);
    } else {
      const mime = fileOrDataUrl.type;
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          processSrc(result, mime);
        } else {
          reject(new Error('Gagal membaca file gambar'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
}

// Alias untuk kompatibilitas impor yang sudah ada
export const compressImage = processImageWithoutCrop;
