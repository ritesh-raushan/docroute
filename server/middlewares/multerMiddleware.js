import multer from 'multer';
import path from 'path';
import { config } from '../config/config.js';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, config.tempUploadPath);
    },
    filename: function (req, file, cb) {
        // Add timestamp to filename to avoid collisions
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const nameWithoutExt = path.basename(file.originalname, ext);
        cb(null, nameWithoutExt + '-' + uniqueSuffix + ext);
    }
});

const fileFilter = (req, file, cb) => {
    if (config.allowedFileTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`File type ${file.mimetype} is not supported. Allowed types: ${config.allowedFileTypes.join(', ')}`), false);
    }
};

// Configure multer
export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: config.maxFileSize,
        files: 1
    }
});