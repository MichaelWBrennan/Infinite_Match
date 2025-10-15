export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { matchType, piecesMatched, position, level, scoreGained } = req.body;
        
        // Track match made (simplified for Vercel)
        console.log('Match made:', {
            matchType,
            piecesMatched,
            position,
            level,
            scoreGained
        });
        
        return res.status(200).json({
            success: true,
            message: 'Match tracked successfully',
            scoreGained
        });
        
    } catch (error) {
        console.error('Error tracking match:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to track match',
            error: error.message
        });
    }
}