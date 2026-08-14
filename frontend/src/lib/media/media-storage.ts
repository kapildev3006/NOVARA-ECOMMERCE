import { UploadedImage } from "@/types/media";

const MAX_STORAGE_SIZE = 1 * 1024 * 1024; // 1MB for prototype payload

export async function processImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Resize if larger than 800px
        const MAX_SIZE = 800;
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context failed"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        
        // Compress to JPEG 0.7
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("Failed to load image for processing"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export async function uploadImage(file: File): Promise<UploadedImage> {
  // In the future: This will call Cloudinary API
  // Current Prototype: Use local compression
  
  try {
    const dataUrl = await processImage(file);
    
    // Estimate base64 size: length * (3/4)
    const sizeInBytes = dataUrl.length * 0.75;
    if (sizeInBytes > MAX_STORAGE_SIZE) {
      throw new Error("Image is too large for local prototype storage. Please use a smaller image.");
    }

    return {
      url: dataUrl,
      publicId: "local-" + Date.now(),
      format: "jpeg"
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to process image.");
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function removeImage(image: UploadedImage | string): Promise<boolean> {
  // In the future: This will call Cloudinary API to delete by publicId
  // Current Prototype: We just return true as we don't hold a central registry
  return true;
}
