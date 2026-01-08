const ytdl = require('@distube/ytdl-core');

exports.handler = async (event, context) => {
    // Set headers for streaming
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
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Missing videoId' })
        };
    }

    try {
        const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

        // Validate URL
        if (!ytdl.validateURL(youtubeUrl)) {
            return {
                statusCode: 400,
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Invalid YouTube URL' })
            };
        }

        // Get video info
        const info = await ytdl.getInfo(youtubeUrl);

        // Select format based on user preference
        let selectedFormat;

        if (format === 'mp3') {
            // Get audio only
            const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
            selectedFormat = audioFormats.find(f => f.audioBitrate >= parseInt(quality)) || audioFormats[0];
        } else {
            // For MP4, get format with both video and audio
            const formats = ytdl.filterFormats(info.formats, 'videoandaudio');
            const qualityLabel = quality + 'p';
      selected Format = formats.find(f => f.qualityLabel?.includes(qualityLabel)) || formats[0];
        }

        if (!selectedFormat) {
            return {
                statusCode: 404,
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Requested quality not available' })
            };
        }

        // Return the direct download URL
        return {
            statusCode: 200,
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                success: true,
                downloadUrl: selectedFormat.url,
                title: info.videoDetails.title,
                quality: selectedFormat.qualityLabel || `${selectedFormat.audioBitrate}kbps`,
                mimeType: selectedFormat.mimeType,
                fileSize: selectedFormat.contentLength
            })
        };

    } catch (error) {
        console.error('Download error:', error);
        return {
            statusCode: 500,
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                error: 'Failed to process download',
                message: error.message
            })
        };
    }
};
