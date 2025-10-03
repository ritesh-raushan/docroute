import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import documentService from '../services/documentService.js';
import geminiService from '../services/geminiService.js';

// Upload and classify document
export const uploadAndClassifyDocument = asyncHandler(async (req, res) => {
    try {
        // File is already validated by middleware
        const file = req.file;

        if (!file) {
            throw new ApiError(400, 'No file uploaded');
        }

        console.log(`Processing uploaded file: ${file.originalname}`);

        // Process and classify the document
        const result = await documentService.processDocument(file);

        // Return success response
        return res.status(200).json(
            new ApiResponse(
                200,
                result,
                'Document uploaded and classified successfully'
            )
        );

    } catch (error) {
        console.error('Upload and classify error:', error);
        
        if (error instanceof ApiError) {
            throw error;
        }
        
        throw new ApiError(500, 'Failed to process document upload');
    }
});

// Classify text content
export const classifyTextContent = asyncHandler(async (req, res) => {
    try {
        const { content } = req.body;

        if (!content) {
            throw new ApiError(400, 'Text content is required');
        }

        console.log(`Classifying text content (${content.length} characters)`);

        // Classify the text content
        const result = await documentService.classifyText(content);

        // Return success response
        return res.status(200).json(
            new ApiResponse(
                200,
                result,
                'Text content classified successfully'
            )
        );

    } catch (error) {
        console.error('Text classification error:', error);
        
        if (error instanceof ApiError) {
            throw error;
        }
        
        throw new ApiError(500, 'Failed to classify text content');
    }
});

// Get supported file types and configuration
export const getSupportedFileTypes = asyncHandler(async (req, res) => {
    try {
        const supportedTypes = documentService.getSupportedTypes();

        return res.status(200).json(
            new ApiResponse(
                200,
                supportedTypes,
                'Supported file types retrieved successfully'
            )
        );

    } catch (error) {
        console.error('Get supported types error:', error);
        throw new ApiError(500, 'Failed to retrieve supported file types');
    }
});

// Check AI service health
export const checkAIServiceHealth = asyncHandler(async (req, res) => {
    try {
        // Test Gemini connection
        const isHealthy = await geminiService.testConnection();

        if (!isHealthy) {
            return res.status(503).json(
                new ApiResponse(
                    503,
                    { healthy: false, service: 'Gemini AI' },
                    'AI service is not responding'
                )
            );
        }

        return res.status(200).json(
            new ApiResponse(
                200,
                { 
                    healthy: true, 
                    service: 'Gemini AI',
                    timestamp: new Date().toISOString()
                },
                'AI service is healthy'
            )
        );

    } catch (error) {
        console.error('Health check error:', error);
        
        return res.status(503).json(
            new ApiResponse(
                503,
                { 
                    healthy: false, 
                    service: 'Gemini AI',
                    error: error.message 
                },
                'AI service health check failed'
            )
        );
    }
});
