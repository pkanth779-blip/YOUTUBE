exports.handler = async (event, context) => {
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

    const { videoId, quality, format } = event.queryStringParameters;

    if (!videoId || !quality || !format) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Missing required parameters' })
        };
    }

    try {
        const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

        // Return the download URL construction
        // The actual download happens client-side using Cobalt API
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                downloadUrl: youtubeUrl,
                videoId: videoId,
                quality: quality,
                format: format
            })
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Failed to generate download link',
                message: error.message
            })
        };
    }
};
