import { v2 as cloudinary } from "cloudinary";
import { config } from "../config/env";
import { Readable } from "stream";

// Configure Cloudinary
if (config.CLOUDINARY_CLOUD_NAME && config.CLOUDINARY_API_KEY && config.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: config.CLOUDINARY_CLOUD_NAME,
    api_key: config.CLOUDINARY_API_KEY,
    api_secret: config.CLOUDINARY_API_SECRET,
  });
}

export const uploadImageToCloudinary = (buffer: Buffer, folder: string = "homepage"): Promise<any> => {
  if (config.NODE_ENV === "test") {
    return Promise.resolve({
      public_id: "mocked_public_id",
      secure_url: "https://mock.cloudinary.com/image.jpg",
      resource_type: "image",
      format: "jpg",
      bytes: 1024,
      width: 800,
      height: 600,
    });
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    const stream = Readable.from(buffer);
    stream.pipe(uploadStream);
  });
};

export const deleteImageFromCloudinary = (publicId: string): Promise<any> => {
  if (config.NODE_ENV === "test") {
    return Promise.resolve({ result: "ok" });
  }

  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, { resource_type: "image" }, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
};
