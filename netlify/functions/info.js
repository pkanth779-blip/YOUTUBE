exports.handler = async (event, context) => {
    // Enable CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    const url = event.queryStringParameters.url;

    if (!url) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'URL parameter is required' })
        };
    }

    try {
        // Extract video ID from URL
        const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
        if (!videoIdMatch) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Invalid YouTube URL' })
            };
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
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                videoId: videoId,
                title: data.title,
                author: data.author_name,
                thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
                thumbnailHq: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
            })
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Failed to fetch video information',
                message: error.message
            })
        };
    }
};
