import { ApiError } from '../utils/ApiError.js';
import { config } from '../config/config.js';
import path from 'path';

// Validate file upload middleware
export const validateFileUpload = (req, res, next) => {
    try {
        // Check if file is present
        if (!req.file) {
            throw new ApiError(400, 'Please upload a document file');
        }

        const file = req.file;

        // Validate file size
        if (file.size > config.maxFileSize) {
            throw new ApiError(400, `File size exceeds maximum limit of ${config.maxFileSize / (1024 * 1024)}MB`);
        }

        // Validate file type
        if (!config.allowedFileTypes.includes(file.mimetype)) {
            throw new ApiError(
                400, 
                `File type '${file.mimetype}' is not supported. Allowed types: ${config.allowedFileTypes.join(', ')}`
            );
        }

        // Validate file extension
        const fileExtension = path.extname(file.originalname).toLowerCase();
        if (!config.supportedExtensions.includes(fileExtension)) {
            throw new ApiError(
                400,
                `File extension '${fileExtension}' is not supported. Allowed extensions: ${config.supportedExtensions.join(', ')}`
            );
        }

        // Check if file has content
        if (file.size === 0) {
            throw new ApiError(400, 'Uploaded file is empty');
        }
        next();
    } catch (error) {
        if (error instanceof ApiError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
                error: error.errors
            });
        }
        
        return res.status(500).json({
            success: false,
            message: 'File validation failed',
            error: error.message
        });
    }
};

// Validate text content middleware
export const validateTextContent = (req, res, next) => {
    try {
        const { content } = req.body;

        // Check if content is present
        if (!content) {
            throw new ApiError(400, 'Text content is required in the request body');
        }

        // Check if content is a string
        if (typeof content !== 'string') {
            throw new ApiError(400, 'Text content must be a string');
        }

        // Check if content is not empty
        if (content.trim().length === 0) {
            throw new ApiError(400, 'Text content cannot be empty');
        }

        next();
    } catch (error) {
        if (error instanceof ApiError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
                error: error.errors
            });
        }
        
        return res.status(500).json({
            success: false,
            message: 'Content validation failed',
            error: error.message
        });
    }
};