"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaAsset = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const mediaAssetSchema = new mongoose_1.Schema({
    assetKey: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    provider: {
        type: String,
        required: true,
        enum: ["cloudinary"],
        default: "cloudinary",
    },
    publicId: {
        type: String,
        required: true,
    },
    url: {
        type: String,
        required: true,
    },
    secureUrl: {
        type: String,
    },
    resourceType: {
        type: String,
        required: true,
        enum: ["image"],
        default: "image",
    },
    format: {
        type: String,
        required: true,
    },
    bytes: {
        type: Number,
    },
    width: {
        type: Number,
    },
    height: {
        type: Number,
    },
    altText: {
        type: String,
    },
    caption: {
        type: String,
    },
    folder: {
        type: String,
    },
    tags: [
        {
            type: String,
        },
    ],
    uploadedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
}, {
    timestamps: true,
});
// Prevent exposing internal Mongoose structure to frontend directly
mediaAssetSchema.set("toJSON", {
    transform: (doc, ret) => {
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});
exports.MediaAsset = mongoose_1.default.models.MediaAsset || mongoose_1.default.model("MediaAsset", mediaAssetSchema);
