import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

// Helper function to compress and resize images
const compressImage = (file: File, maxDimension: number = 1024, quality: number = 0.8): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Failed to get canvas context.'));
        }

        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round(height * (maxDimension / width));
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round(width * (maxDimension / height));
            height = maxDimension;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Use better image rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error('Canvas to Blob failed.'));
            }
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = (err) => reject(new Error('Failed to load image'));
    };
    reader.onerror = (err) => reject(new Error('Failed to read file'));
  });
};

export const uploadImage = (
  file: File,
  path: string,
  onProgress: (progress: number) => void,
  maxDimension: number = 1024,
  quality: number = 0.8
): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      // Optimize image before upload if it's larger than 500KB or dimensions exceed maxDimension
      let processedFile = file;
      
      if (file.size > 500 * 1024) { // If file is larger than 500KB
        try {
          processedFile = await compressImage(file, maxDimension, quality);
        } catch (compressionError) {
          console.warn('Image compression failed, uploading original:', compressionError);
          // Continue with original file if compression fails
        }
      }

      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, processedFile);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(progress);
        },
        (error) => {
          console.error("Upload failed:", error);
          reject(new Error(`Upload failed: ${error.message}`));
        },
        () => {
          // Handle successful uploads on complete
          getDownloadURL(uploadTask.snapshot.ref)
            .then((downloadURL) => {
              resolve(downloadURL);
            })
            .catch((error) => {
              reject(new Error(`Failed to get download URL: ${error.message}`));
            });
        }
      );
    } catch (error) {
      reject(new Error(`Failed to process image: ${(error as Error).message}`));
    }
  });
};
