import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

// Function to resize image to fit Firebase limits
const resizeImage = (file: File, maxWidth: number = 1024, maxHeight: number = 1024, quality: number = 0.8): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const resizedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now(),
          });
          resolve(resizedFile);
        } else {
          resolve(file);
        }
      }, file.type, quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

export const uploadImage = async (
  file: File,
  path: string,
  onProgress: (progress: number) => void
): Promise<string> => {
  try {
    // Resize image before upload to optimize for Firebase
    const resizedFile = await resizeImage(file);
    
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, resizedFile);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(progress);
        },
        (error) => {
          // Handle unsuccessful uploads
          console.error("Upload failed:", error);
          reject(error);
        },
        () => {
          // Handle successful uploads on complete
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            resolve(downloadURL);
          }).catch((error) => {
            console.error("Failed to get download URL:", error);
            reject(error);
          });
        }
      );
    });
  } catch (error) {
    console.error("Image processing failed:", error);
    throw error;
  }
};
