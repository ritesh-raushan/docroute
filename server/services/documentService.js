import fs from 'fs/promises';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { ApiError } from '../utils/ApiError.js';
import geminiService from './geminiService.js';
import { config } from '../config/config.js';

class DocumentService {
    constructor() {
        this.supportedMimeTypes = {
            'application/pdf': 'pdf',
            'text/plain': 'txt'
        };
    }

    // Extract text from PDF file
    async extractTextFromPDF(filePath) {
        try {
            const dataBuffer = await fs.readFile(filePath);
            const data = await pdfParse(dataBuffer);
            
            if (!data.text || data.text.trim().length === 0) {
                throw new ApiError(400, 'PDF file appears to be empty or contains no extractable text');
            }
            return data.text;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            console.error('PDF extraction error:', error);
            throw new ApiError(500, 'Failed to extract text from PDF file');
        }
    }

    // Extract text from TXT file
    async extractTextFromTXT(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            
            if (!content || content.trim().length === 0) {
                throw new ApiError(400, 'Text file is empty');
            }
            return content;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            console.error('Text file reading error:', error);
            throw new ApiError(500, 'Failed to read text file');
        }
    }

    // Extract text content from uploaded file based on mime type
    async extractTextFromFile(filePath, mimeType) {
        try {
            if (!filePath) {
                throw new ApiError(400, 'File path is required');
            }
            // Check if file exists
            try {
                await fs.access(filePath);
            } catch {
                throw new ApiError(404, 'File not found');
            }

            const fileType = this.supportedMimeTypes[mimeType];
            
            if (!fileType) {
                throw new ApiError(400, `Unsupported file type: ${mimeType}`);
            }

            let extractedText = '';

            switch (fileType) {
                case 'pdf':
                    extractedText = await this.extractTextFromPDF(filePath);
                    break;
                case 'txt':
                    extractedText = await this.extractTextFromTXT(filePath);
                    break;
                default:
                    throw new ApiError(400, 'Unsupported file format');
            }

            // Validate extracted content
            if (!extractedText || extractedText.trim().length === 0) {
                throw new ApiError(400, 'No text content could be extracted from the file');
            }

            return extractedText;

        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            console.error('Text extraction error:', error);
            throw new ApiError(500, 'Failed to extract text from file');
        }
    }

    // Process and classify uploaded document
    async processDocument(file) {
        let tempFilePath = null;
        
        try {
            if (!file) {
                throw new ApiError(400, 'No file provided');
            }

            tempFilePath = file.path;

            // Validate file size
            if (file.size > config.maxFileSize) {
                throw new ApiError(400, `File size exceeds maximum limit of ${config.maxFileSize / (1024 * 1024)}MB`);
            }

            // Validate file type
            if (!config.allowedFileTypes.includes(file.mimetype)) {
                throw new ApiError(400, `File type ${file.mimetype} is not supported. Allowed types: ${config.allowedFileTypes.join(', ')}`);
            }

            // Extract text from the document
            console.log(`Extracting text from ${file.originalname} (${file.mimetype})...`);
            const extractedText = await this.extractTextFromFile(file.path, file.mimetype);

            // Truncate text if too long (to avoid token limits)
            const maxTextLength = 50000;
            const textToClassify = extractedText.length > maxTextLength 
                ? extractedText.substring(0, maxTextLength) + '\n...(truncated)'
                : extractedText;

            console.log(`Text extracted (${extractedText.length} characters). Classifying...`);

            // Classify document using Gemini AI
            const classification = await geminiService.classifyDocument(textToClassify);

            // Build complete response
            const result = this.buildClassificationResult(classification, {
                fileName: file.originalname,
                fileSize: file.size,
                mimeType: file.mimetype,
                uploadedAt: new Date().toISOString()
            });

            console.log(`Document classified as ${result.documentType} with ${(result.confidence * 100).toFixed(1)}% confidence`);

            return result;

        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            console.error('Document processing error:', error);
            throw new ApiError(500, 'Failed to process document');
        } finally {
            // Clean up temporary file
            if (tempFilePath) {
                await this.cleanupTempFile(tempFilePath);
            }
        }
    }

    // Classify text content
    async classifyText(textContent) {
        try {
            if (!textContent || typeof textContent !== 'string') {
                throw new ApiError(400, 'Text content is required');
            }

            if (textContent.trim().length === 0) {
                throw new ApiError(400, 'Text content cannot be empty');
            }

            // Truncate text if too long
            const maxTextLength = 50000;
            const textToClassify = textContent.length > maxTextLength 
                ? textContent.substring(0, maxTextLength) + '\n...(truncated)'
                : textContent;

            console.log(`Classifying text content (${textContent.length} characters)...`);

            // Classify using Gemini AI
            const classification = await geminiService.classifyDocument(textToClassify);

            // Build response
            const result = this.buildClassificationResult(classification, {
                contentLength: textContent.length,
                classifiedAt: new Date().toISOString()
            });

            console.log(`Text classified as ${result.documentType} with ${(result.confidence * 100).toFixed(1)}% confidence`);

            return result;

        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            console.error('Text classification error:', error);
            throw new ApiError(500, 'Failed to classify text content');
        }
    }

    // result
    buildClassificationResult(classification, metadata = {}) {
        return {
            ...metadata,
            documentType: classification.documentType,
            confidence: classification.confidence,
            department: classification.department,
            routingConfidence: classification.routingConfidence,
            extractedData: classification.extractedData,
            reasoning: classification.reasoning,
            suggestedActions: classification.suggestedActions,
            confidenceLevel: this.getConfidenceLevel(classification.confidence),
            routingRecommendation: this.getRoutingRecommendation(
                classification.department,
                classification.routingConfidence
            )
        };
    }
    // Get confidence level description
    getConfidenceLevel(confidence) {
        if (confidence >= config.confidenceLevels.HIGH) {
            return 'high';
        } else if (confidence >= config.confidenceLevels.MEDIUM) {
            return 'medium';
        }
        return 'low';
    }

    // Get routing recommendation based on department and confidence
    getRoutingRecommendation(department, confidence) {
        const departmentNames = {
            finance: 'Finance Department',
            procurement: 'Procurement Department',
            legal: 'Legal Department',
            operations: 'Operations Department',
            general: 'General Administration'
        };

        const deptName = departmentNames[department] || 'General Administration';

        if (confidence >= config.confidenceLevels.HIGH) {
            return `Recommended for automatic routing to ${deptName}`;
        } else if (confidence >= config.confidenceLevels.MEDIUM) {
            return `Suggested routing to ${deptName} - Manual review recommended`;
        }
        return `Low confidence routing to ${deptName} - Manual review required`;
    }

    // Clean up temporary file
    async cleanupTempFile(filePath) {
        try {
            await fs.unlink(filePath);
            console.log(`Cleaned up temporary file: ${filePath}`);
        } catch (error) {
            console.error(`Failed to delete temporary file ${filePath}:`, error.message);
        }
    }

    // Get supported file types information
    getSupportedTypes() {
        return {
            supportedFormats: [
                {
                    type: 'PDF',
                    mimeType: 'application/pdf',
                    extension: '.pdf',
                    description: 'Portable Document Format'
                },
                {
                    type: 'Text',
                    mimeType: 'text/plain',
                    extension: '.txt',
                    description: 'Plain Text File'
                }
            ],
            maxFileSize: config.maxFileSize,
            maxFileSizeMB: (config.maxFileSize / (1024 * 1024)).toFixed(2),
            documentTypes: Object.values(config.documentTypes),
            departments: Object.values(config.departments),
            confidenceThreshold: config.confidenceThreshold
        };
    }
}

export default new DocumentService();