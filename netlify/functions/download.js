const fetch = require('node-fetch');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    const { videoId, quality, format } = event.queryStringParameters || JSON.parse(event.body || '{}');

    if (!videoId) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Missing videoId parameter' })
        };
    }

    try {
        const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

        // Step 1: Get video info from yt1s.io
        const analyzeResponse = await fetch('https://yt1s.io/api/ajaxSearch/index', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            body: `q=${encodeURIComponent(youtubeUrl)}&vt=${format === 'mp3' ? 'mp3' : 'mp4'}`
        });

        const analyzeData = await analyzeResponse.json();

        if (analyzeData.status !== 'ok') {
            throw new Error('Failed to analyze video');
        }

        // Step 2: Get the download link
        const kValue = analyzeData.links[format === 'mp3' ? 'mp3' : 'mp4'][quality] ||
            Object.values(analyzeData.links[format === 'mp3' ? 'mp3' : 'mp4'])[0];

        if (!kValue || !kValue.k) {
            throw new Error('Quality not available');
        }

        const convertResponse = await fetch('https://yt1s.io/api/ajaxConvert/convert', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            body: `vid=${videoId}&k=${kValue.k}`
        });

        const convertData = await convertResponse.json();

        if (convertData.status === 'ok' && convertData.dlink) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    downloadUrl: convertData.dlink,
                    quality: kValue.q || quality,
                    format: format
                })
            };
        }

        throw new Error('Failed to get download link');

    } catch (error) {
        console.error('Download error:', error);
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
