export default function handler(req, res) {
    const healthCheck = {
        uptime: process.uptime(),
        message: 'OK',
        timestamp: new Date().toISOString(),
        services: {
            analytics: 'enabled',
            cloud: 'enabled',
            monitoring: 'enabled'
        }
    };
    
    try {
        res.status(200).json(healthCheck);
    } catch (error) {
        healthCheck.message = 'ERROR';
        res.status(503).json(healthCheck);
    }
}