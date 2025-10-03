import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { config, validateConfig } from './config/config.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
    origin: config.corsOrigin,
    credentials: true
}));

app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({extended: true, limit: "16kb"}));
app.use(express.static("public"));

// Routes
import documentRouter from './routes/documentRoute.js';

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'DocRoute API Server',
        version: '1.0.0',
        endpoints: {
            upload: 'POST /api/documents/upload',
            classifyText: 'POST /api/documents/classify-text',
            supportedTypes: 'GET /api/documents/supported-types',
            health: 'GET /api/documents/health'
        }
    });
});

// Routes Declaration
app.use('/api/documents', documentRouter);

// Error handling middleware
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    
    console.error('Error:', err);
    
    res.status(statusCode).json({
        success: false,
        message: message,
        errors: err.errors || [],
        ...(config.nodeEnv === 'development' && { stack: err.stack })
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl
    });
});

// Start server
const PORT = config.port;
try {
    validateConfig();
    
    app.listen(PORT, () => {
        console.log(`DocRoute Server Started and running on: http://localhost:${PORT}`);
    });
} catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
}

export { app };