const path = require("path");
require("dotenv").config({
    path: path.join(__dirname, "../.env")
});

const multer = require("multer");
const multerS3 = require("multer-s3");
const { S3Client } = require("@aws-sdk/client-s3");
const { randomUUID } = require("crypto");

// 1. Connect to AWS S3
const s3 = new S3Client({
    region: process.env.AWS_REGION || "ap-southeast-2",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// 2. Allowed image types
const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "image/webp",
    "image/gif"
];

// 3. File filter
const fileFilter = (req, file, cb) => {

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Unsupported file type"), false);
    }

};

// 4. Configure Multer with S3 storage
const storage = multerS3({

    s3: s3,

    bucket: process.env.AWS_BUCKET_NAME,

    contentType: multerS3.AUTO_CONTENT_TYPE,

    metadata: (req, file, cb) => {
        cb(null, {
            fieldName: file.fieldname
        });
    },

    key: (req, file, cb) => {

        const uniqueName =
            Date.now() +
            "-" +
            randomUUID() +
            path.extname(file.originalname).toLowerCase();

        cb(null, `products/${uniqueName}`);

    }

});

// 5. Multer configuration
const upload = multer({

    storage,

    fileFilter,

    limits: {
        fileSize: 50 * 1024 * 1024
    }

});

module.exports = upload;
