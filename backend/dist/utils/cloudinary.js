"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteImageFromCloudinary = exports.uploadImageToCloudinary = void 0;
const cloudinary_1 = require("cloudinary");
const env_1 = require("../config/env");
const stream_1 = require("stream");
// Configure Cloudinary
if (env_1.config.CLOUDINARY_CLOUD_NAME && env_1.config.CLOUDINARY_API_KEY && env_1.config.CLOUDINARY_API_SECRET) {
    cloudinary_1.v2.config({
        cloud_name: env_1.config.CLOUDINARY_CLOUD_NAME,
        api_key: env_1.config.CLOUDINARY_API_KEY,
        api_secret: env_1.config.CLOUDINARY_API_SECRET,
    });
}
const uploadImageToCloudinary = (buffer, folder = "homepage") => {
    if (env_1.config.NODE_ENV === "test") {
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
        const uploadStream = cloudinary_1.v2.uploader.upload_stream({
            folder: folder,
            resource_type: "image",
        }, (error, result) => {
            if (error) {
                reject(error);
            }
            else {
                resolve(result);
            }
        });
        const stream = stream_1.Readable.from(buffer);
        stream.pipe(uploadStream);
    });
};
exports.uploadImageToCloudinary = uploadImageToCloudinary;
const deleteImageFromCloudinary = (publicId) => {
    if (env_1.config.NODE_ENV === "test") {
        return Promise.resolve({ result: "ok" });
    }
    return new Promise((resolve, reject) => {
        cloudinary_1.v2.uploader.destroy(publicId, { resource_type: "image" }, (error, result) => {
            if (error) {
                reject(error);
            }
            else {
                resolve(result);
            }
        });
    });
};
exports.deleteImageFromCloudinary = deleteImageFromCloudinary;
