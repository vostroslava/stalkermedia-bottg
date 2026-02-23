import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config';
import subscriptionRoutes from './routes/subscription';
import resultsRoutes from './routes/results';
import testsRoutes, { preloadMatrices } from './routes/tests';

// ESM эквивалент __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS для development
app.use(cors({
    origin: config.isDev ? '*' : config.appUrl,
    credentials: true,
}));

// JSON body parser
app.use(express.json());

// API routes
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/results', resultsRoutes);
app.use('/api/tests', testsRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        env: config.nodeEnv,
    });
});

// Serve static files in production
if (!config.isDev) {
    const staticPath = path.resolve(__dirname, '../../webapp/dist');
    app.use(express.static(staticPath));

    // SPA fallback
    app.get('*', (req, res) => {
        res.sendFile(path.join(staticPath, 'index.html'));
    });
}

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: config.isDev ? err.message : undefined,
    });
});

// Start server
async function start() {
    // Предзагрузка матриц
    preloadMatrices();

    app.listen(config.port, () => {
        console.log(`
🚀 Server started!
   Port: ${config.port}
   Mode: ${config.nodeEnv}
   Channel: ${config.channelId}
   
   API endpoints:
   - GET  /api/health
   - GET  /api/tests
   - GET  /api/tests/:testCode
   - GET  /api/subscription/check
   - POST /api/results
    `);
    });
}

start().catch(console.error);

export { app };
