import { v4 as uuidv4 } from 'uuid';

export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { level = 1, difficulty = 'normal', platform = 'web' } = req.body;
        
        const gameSession = {
            sessionId: uuidv4(),
            level,
            difficulty,
            platform,
            startTime: new Date().toISOString(),
            playerId: req.body.playerId || uuidv4()
        };
        
        // Track game start (simplified for Vercel)
        console.log('Game started:', gameSession);
        
        return res.status(200).json({
            success: true,
            message: 'Game started successfully',
            sessionId: gameSession.sessionId,
            level: gameSession.level,
            difficulty: gameSession.difficulty,
            playerId: gameSession.playerId
        });
        
    } catch (error) {
        console.error('Error starting game:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to start game',
            error: error.message
        });
    }
}