import { Router } from 'express';
import { upload } from '../middlewares/multerMiddleware.js';
import { validateFileUpload, validateTextContent } from '../middlewares/validationMiddleware.js';
import {
    uploadAndClassifyDocument,
    getSupportedFileTypes,
    checkAIServiceHealth,
    classifyTextContent
} from '../controllers/documentController.js';

const router = Router();

// route - POST /api/documents/upload
router.post('/upload', 
    upload.single('document'), 
    validateFileUpload, 
    uploadAndClassifyDocument
);


// route - POST /api/documents/classify-text
// desc - Classify text content directly
router.post('/classify-text', 
    validateTextContent, 
    classifyTextContent
);


// route - GET /api/documents/supported-types
// desc - Get supported file types and limits
router.get('/supported-types', getSupportedFileTypes);


// route - GET /api/documents/health
// desc - Check AI service health
router.get('/health', checkAIServiceHealth);

export default router;