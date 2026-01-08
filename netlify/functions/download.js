const fetch = require('node-fetch');
const ytdl = require('ytdl-core');
const FormData = require('form-data');
const { Readable } = require('stream');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

        // Validate YouTube URL
        if (!ytdl.validateURL(youtubeUrl)) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Invalid YouTube URL' })
            };
        }

        // Get video info
        const info = await ytdl.getInfo(youtubeUrl);
        const title = info.videoDetails.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();

        // Select appropriate format
        let ytdlOptions = {};
        if (format === 'mp3') {
            ytdlOptions = {
                quality: 'highestaudio',
                filter: 'audioonly'
            };
        } else {
            ytdlOptions = {
                quality: 'highest',
                filter: 'videoandaudio'
            };
        }

        // Download video stream
        const videoStream = ytdl(youtubeUrl, ytdlOptions);

        // Upload to tmpfiles.org for temporary hosting
        const form = new FormData();
        form.append('file', videoStream, {
            filename: `${title}.${format === 'mp3' ? 'm4a' : 'mp4'}`,
            contentType: format === 'mp3' ? 'audio/mp4' : 'video/mp4'
        });

        const uploadResponse = await fetch('https://tmpfiles.org/api/v1/upload', {
            method: 'POST',
            body: form,
            headers: form.getHeaders()
        });

        const uploadData = await uploadResponse.json();

        if (uploadData.status === 'success' && uploadData.data && uploadData.data.url) {
            // tmpfiles.org returns URL like: https://tmpfiles.org/12345
            // Need to convert to direct download: https://tmpfiles.org/dl/12345
            const downloadUrl = uploadData.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    downloadUrl: downloadUrl,
                    quality: quality,
                    format: format,
                    title: title,
                    expiresIn: '1 hour or after first download'
                })
            };
        }

        throw new Error('Failed to upload to temporary storage');

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
