const ytdl = require('ytdl-core');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
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
        const url = `https://www.youtube.com/watch?v=${videoId}`;

        // Validate URL
        if (!ytdl.validateURL(url)) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Invalid YouTube URL' })
            };
        }

        // Get video info
        const info = await ytdl.getInfo(url);

        // Filter formats based on user preference
        let selectedFormat;

        if (format === 'mp3') {
            // Get audio only
            const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
            selectedFormat = audioFormats.find(f => f.audioBitrate >= parseInt(quality)) || audioFormats[0];
        } else {
            // Get video with audio
            const videoFormats = ytdl.filterFormats(info.formats, 'videoandaudio');
            selectedFormat = videoFormats.find(f => f.qualityLabel?.includes(quality)) || videoFormats[0];
        }

        if (!selectedFormat) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'Requested quality not available' })
            };
        }

        // Return download info
        return {
            statusCode: 200,
            headers: {
                ...headers,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: true,
                title: info.videoDetails.title,
                downloadUrl: selectedFormat.url,
                mimeType: selectedFormat.mimeType,
                fileSize: selectedFormat.contentLength,
                quality: selectedFormat.qualityLabel || `${selectedFormat.audioBitrate}kbps`
            })
        };

    } catch (error) {
        console.error('Download error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Failed to process download',
                message: error.message
            })
        };
    }
};
