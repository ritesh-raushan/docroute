import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/config.js';
import { ApiError } from '../utils/ApiError.js';

class GeminiService {
    constructor() {
        if (!config.geminiApiKey) {
            throw new ApiError(500, 'Gemini API key is not configured');
        }
        
        this.genAI = new GoogleGenerativeAI(config.geminiApiKey);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        // Classification prompt template
        this.classificationPrompt = `
You are a professional document classification and routing assistant for back-office operations. 

Analyze the provided document content and classify it according to these document types:
- invoice: Bills for goods/services provided
- purchase_order: Orders for goods/services to be purchased
- contract: Legal agreements and contracts
- receipt: Payment confirmations and receipts
- proposal: Business proposals and quotes
- agreement: Various types of agreements
- other: Documents that don't fit the above categories

Route documents to these departments:
- finance: Invoices, receipts, financial statements, payment records, billing documents
- procurement: Purchase orders, vendor agreements, supplier contracts
- legal: Contracts, legal agreements, compliance documents, terms of service
- operations: Operational agreements, service contracts, facility management
- general: Documents that don't fit specific departments

IMPORTANT: You must ALWAYS return your analysis in the following JSON format, even if you cannot extract full text content:

{
    "documentType": "classified_type",
    "confidence": 0.95,
    "department": "assigned_department", 
    "routingConfidence": 0.90,
    "extractedData": {
        "key_information": "extracted values"
    },
    "reasoning": "Brief explanation of classification logic",
    "suggestedActions": ["action1", "action2"]
}

If you cannot determine the document type from the provided content, use "other" as documentType with lower confidence. If PDF text extraction is needed, mention it in the reasoning field. NEVER respond with plain text - always return valid JSON.

Confidence scores should be between 0 and 1. Be thorough in extracting relevant data like amounts, dates, vendor names, etc.

Document content:
`;
    }

    // Classify document content using Gemini
    async classifyDocument(documentContent) {
        try {
            if (!documentContent || typeof documentContent !== 'string') {
                throw new ApiError(400, 'Document content is required and must be a string');
            }

            const prompt = this.classificationPrompt + documentContent;
            
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Parse JSON response from Gemini
            let classificationResult;
            try {
                // Extract JSON from response (in case there's extra text)
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (!jsonMatch) {
                    throw new Error('No JSON found in response');
                }
                classificationResult = JSON.parse(jsonMatch[0]);
            } catch (parseError) {
                console.error('Failed to parse Gemini response:', text);
                
                // Fallback: Create a default classification when JSON parsing fails
                classificationResult = {
                    documentType: 'other',
                    confidence: 0.3,
                    department: 'general',
                    routingConfidence: 0.3,
                    extractedData: {
                        note: 'AI could not classify this document properly'
                    },
                    reasoning: 'Classification failed due to non-JSON response from AI model',
                    suggestedActions: ['Manual review required', 'Check document format and content']
                };
                
                console.log('Using fallback classification due to parsing error');
            }

            // Validate and sanitize the response
            return this.validateClassificationResult(classificationResult);

        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            console.error('Gemini classification error:', error);
            throw new ApiError(500, 'Failed to classify document with AI model');
        }
    }

    // Validate and sanitize classification result from Gemini
    validateClassificationResult(result) {
        const validDocumentTypes = Object.values(config.documentTypes);
        const validDepartments = Object.values(config.departments);

        // Validate document type
        if (!result.documentType || !validDocumentTypes.includes(result.documentType.toLowerCase())) {
            result.documentType = config.documentTypes.OTHER;
        } else {
            result.documentType = result.documentType.toLowerCase();
        }

        // Validate department
        if (!result.department || !validDepartments.includes(result.department.toLowerCase())) {
            result.department = config.departments.GENERAL;
        } else {
            result.department = result.department.toLowerCase();
        }

        // Validate confidence scores
        result.confidence = this.validateConfidence(result.confidence);
        result.routingConfidence = this.validateConfidence(result.routingConfidence);

        // Ensure required fields
        result.extractedData = result.extractedData || {};
        result.reasoning = result.reasoning || 'Classification completed';
        result.suggestedActions = Array.isArray(result.suggestedActions) ? result.suggestedActions : [];

        return result;
    }

    // Validate confidence score
    validateConfidence(confidence) {
        const numConfidence = parseFloat(confidence);
        if (isNaN(numConfidence) || numConfidence < 0 || numConfidence > 1) {
            return 0.5; // Default confidence
        }
        return numConfidence;
    }

    // Test Gemini connection
    async testConnection() {
        try {
            const result = await this.model.generateContent("Hello, please respond with 'Connection successful'");
            const response = await result.response;
            return response.text().includes('Connection successful');
        } catch (error) {
            console.error('Gemini connection test failed:', error);
            return false;
        }
    }
}

export default new GeminiService();