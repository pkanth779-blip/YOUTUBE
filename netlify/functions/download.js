const fetch = require('node-fetch');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    const { videoId, quality, format } = event.queryStringParameters;

    if (!videoId) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Missing videoId parameter' })
        };
    }

    try {
        const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

        // Use a third-party API for downloads
        // Option 1: Try using loader.to API (free, no auth needed)
        const apiUrl = `https://loader.to/ajax/download.php?format=${format}&url=${encodeURIComponent(youtubeUrl)}&api=dfcb6d76f2f6a9894gjkege8a4ab232222`;

        const response = await fetch(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const data = await response.json();

        if (data.success && data.download) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    downloadUrl: data.download,
                    quality: quality,
                    format: format
                })
            };
        }

        // Fallback: Return y2mate page URL
        const fallbackUrl = format === 'mp3'
            ? `https://www.y2mate.com/download/${videoId}/mp3/${quality}`
            : `https://www.y2mate.com/download/${videoId}/mp4/${quality}`;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                downloadUrl: fallbackUrl,
                quality: quality,
                format: format
            })
        };

    } catch (error) {
        console.error('Download error:', error);

        // Return a fallback URL on error
        const fallbackUrl = format === 'mp3'
            ? `https://www.y2mate.com/youtube-mp3/${videoId}`
            : `https://www.y2mate.com/youtube/${videoId}`;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                downloadUrl: fallbackUrl,
                quality: quality,
                format: format,
                fallback: true
            })
        };
    }
};
