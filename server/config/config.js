import dotenv from 'dotenv';

dotenv.config();

export const config = {
    // Server Configuration
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || '*',
    
    // Google Gemini API
    geminiApiKey: process.env.GEMINI_API_KEY,
    
    // File Upload Configuration
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
    allowedFileTypes: process.env.ALLOWED_FILE_TYPES 
        ? process.env.ALLOWED_FILE_TYPES.split(',')
        : ['application/pdf', 'text/plain'],
    
    // Classification Configuration
    confidenceThreshold: parseFloat(process.env.CONFIDENCE_THRESHOLD) || 0.7,
    maxConcurrentRequests: parseInt(process.env.MAX_CONCURRENT_REQUESTS) || 10,
    
    // Document Types
    documentTypes: {
        INVOICE: 'invoice',
        PURCHASE_ORDER: 'purchase_order',
        CONTRACT: 'contract',
        RECEIPT: 'receipt',
        PROPOSAL: 'proposal',
        AGREEMENT: 'agreement',
        OTHER: 'other'
    },
    
    // Departments for Routing
    departments: {
        FINANCE: 'finance',
        PROCUREMENT: 'procurement',
        LEGAL: 'legal',
        OPERATIONS: 'operations',
        GENERAL: 'general'
    },
    
    // File upload paths
    tempUploadPath: './public/temp',
    
    // Supported file extensions
    supportedExtensions: ['.pdf', '.txt'],
    
    // Classification confidence levels
    confidenceLevels: {
        HIGH: 0.8,
        MEDIUM: 0.6,
        LOW: 0.4
    }
};

// Validation function to ensure required config is present
export const validateConfig = () => {
    if (!config.geminiApiKey) {
        throw new Error('GEMINI_API_KEY is required in environment variables');
    }
    
    console.log('✓ Configuration validated successfully');
    return true;
};