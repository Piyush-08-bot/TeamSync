import express from 'express';

const router = express.Router();

router.get('/test', (req, res) => {
    console.log('Test route called');
    res.status(200).json({
        success: true,
        message: 'Test route working correctly',
        timestamp: new Date().toISOString()
    });
});

export default router;