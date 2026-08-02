import { OpenRouter } from '@openrouter/sdk';
import { config } from '../config/config.js';
import { ApiError } from '../utils/ApiError.js';

class OpenRouterService {
    constructor() {
        if (!config.openrouterApiKey) {
            throw new ApiError(500, 'OpenRouter API key is not configured');
        }

        this.client = new OpenRouter({
            apiKey: config.openrouterApiKey,
        });

        this.model = config.openrouterModel;

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

    async classifyDocument(documentContent) {
        try {
            if (!documentContent || typeof documentContent !== 'string') {
                throw new ApiError(400, 'Document content is required and must be a string');
            }

            const response = await this.client.chat.send({
                chatRequest: {
                    model: this.model,
                    messages: [
                        {
                            role: 'user',
                            content: this.classificationPrompt + documentContent,
                        },
                    ],
                },
            });

            const text = response.choices[0].message.content;

            let classificationResult;
            try {
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (!jsonMatch) {
                    throw new Error('No JSON found in response');
                }
                classificationResult = JSON.parse(jsonMatch[0]);
            } catch (parseError) {
                console.error('Failed to parse OpenRouter response:', text);

                classificationResult = {
                    documentType: 'other',
                    confidence: 0.3,
                    department: 'general',
                    routingConfidence: 0.3,
                    extractedData: {
                        note: 'AI could not classify this document properly',
                    },
                    reasoning: 'Classification failed due to non-JSON response from AI model',
                    suggestedActions: ['Manual review required', 'Check document format and content'],
                };

                console.log('Using fallback classification due to parsing error');
            }

            return this.validateClassificationResult(classificationResult);
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            console.error('OpenRouter classification error:', error);
            throw new ApiError(500, 'Failed to classify document with AI model');
        }
    }

    validateClassificationResult(result) {
        const validDocumentTypes = Object.values(config.documentTypes);
        const validDepartments = Object.values(config.departments);

        if (!result.documentType || !validDocumentTypes.includes(result.documentType.toLowerCase())) {
            result.documentType = config.documentTypes.OTHER;
        } else {
            result.documentType = result.documentType.toLowerCase();
        }

        if (!result.department || !validDepartments.includes(result.department.toLowerCase())) {
            result.department = config.departments.GENERAL;
        } else {
            result.department = result.department.toLowerCase();
        }

        result.confidence = this.validateConfidence(result.confidence);
        result.routingConfidence = this.validateConfidence(result.routingConfidence);

        result.extractedData = result.extractedData || {};
        result.reasoning = result.reasoning || 'Classification completed';
        result.suggestedActions = Array.isArray(result.suggestedActions) ? result.suggestedActions : [];

        return result;
    }

    validateConfidence(confidence) {
        const numConfidence = parseFloat(confidence);
        if (isNaN(numConfidence) || numConfidence < 0 || numConfidence > 1) {
            return 0.5;
        }
        return numConfidence;
    }

    async testConnection() {
        try {
            const response = await this.client.chat.send({
                chatRequest: {
                    model: this.model,
                    messages: [
                        {
                            role: 'user',
                            content: "Hello, please respond with 'Connection successful'",
                        },
                    ],
                },
            });

            return response.choices[0].message.content.includes('Connection successful');
        } catch (error) {
            console.error('OpenRouter connection test failed:', error);
            return false;
        }
    }
}

export default new OpenRouterService();
