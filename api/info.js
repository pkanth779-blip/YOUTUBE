export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'URL parameter is required' });
    }

    try {
        // Extract video ID from URL
        const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
        if (!videoIdMatch) {
            return res.status(400).json({ error: 'Invalid YouTube URL' });
        }

        const videoId = videoIdMatch[1];

        // Fetch video info using YouTube oEmbed API (no API key needed)
        const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
        const response = await fetch(oembedUrl);

        if (!response.ok) {
            throw new Error('Failed to fetch video info');
        }

        const data = await response.json();

        // Return video information
        return res.status(200).json({
            success: true,
            videoId: videoId,
            title: data.title,
            author: data.author_name,
            thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
            thumbnailHq: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
        });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            error: 'Failed to fetch video information',
            message: error.message
        });
    }
}
