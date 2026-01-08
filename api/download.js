export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { videoId, quality, format } = req.query;

    if (!videoId || !quality || !format) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
        // Using RapidAPI YouTube Download API
        // For production, you'd need to sign up for an API key
        // For now, we'll construct direct download URLs using multiple services

        const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

        // Option 1: Use Y2Mate API endpoint
        const downloadUrl = `https://www.y2mate.com/api/ajaxSearch?url=${encodeURIComponent(youtubeUrl)}&q=${quality}&vt=${format}`;

        // Return the download URL for the client to fetch
        return res.status(200).json({
            success: true,
            downloadUrl: downloadUrl,
            videoId: videoId,
            quality: quality,
            format: format
        });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            error: 'Failed to generate download link',
            message: error.message
        });
    }
}
