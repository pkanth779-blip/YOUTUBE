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
            body: JSON.stringify({ error: 'Missing videoId' })
        };
    }

    try {
        // Simply return SaveFrom.net links - they handle all the complexity
        const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const downloadUrl = `https://sfrom.net/en1/${encodeURIComponent(youtubeUrl)}`;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                downloadUrl: downloadUrl,
                quality: quality,
                format: format,
                method: 'redirect',
                note: 'Opens in new tab - auto-deletes after download'
            })
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Failed to generate link',
                message: error.message
            })
        };
    }
};
