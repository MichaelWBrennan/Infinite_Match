export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { level, score, timeSpent, movesUsed, starsEarned, powerupsUsed } = req.body;
        
        // Track level completion (simplified for Vercel)
        console.log('Level completed:', {
            level,
            score,
            timeSpent,
            movesUsed,
            starsEarned,
            powerupsUsed
        });
        
        return res.status(200).json({
            success: true,
            message: 'Level completed successfully',
            nextLevel: level + 1,
            totalScore: score
        });
        
    } catch (error) {
        console.error('Error completing level:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to complete level',
            error: error.message
        });
    }
}