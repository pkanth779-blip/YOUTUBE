const express = require('express');
const cors = require('cors');
const ytdl = require('ytdl-core');

const app = express();
app.use(cors());
app.use(express.json());

// Get video info endpoint
app.get('/api/info', async (req, res) => {
    try {
        const { url } = req.query;

        if (!url || !ytdl.validateURL(url)) {
            return res.status(400).json({ error: 'Invalid YouTube URL' });
        }

        const info = await ytdl.getInfo(url);
        const formats = ytdl.filterFormats(info.formats, 'videoandaudio');
        const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');

        // Extract quality options
        const videoQualities = formats.map(f => ({
            quality: f.qualityLabel,
            itag: f.itag,
            mimeType: f.mimeType,
            container: f.container
        }));

        const audioQualities = audioFormats.map(f => ({
            quality: f.audioBitrate ? `${f.audioBitrate}kbps` : 'Unknown',
            itag: f.itag,
            mimeType: f.mimeType
        }));

        res.json({
            title: info.videoDetails.title,
            thumbnail: info.videoDetails.thumbnails[0].url,
            videoQualities,
            audioQualities
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch video info' });
    }
});

// Download endpoint
app.get('/api/download', async (req, res) => {
    try {
        const { url, itag } = req.query;

        if (!url || !ytdl.validateURL(url)) {
            return res.status(400).json({ error: 'Invalid YouTube URL' });
        }

        const info = await ytdl.getInfo(url);
        const format = info.formats.find(f => f.itag === parseInt(itag));

        if (!format) {
            return res.status(404).json({ error: 'Quality not found' });
        }

        res.header('Content-Disposition', `attachment; filename="${info.videoDetails.title}.${format.container}"`);

        ytdl(url, { quality: itag }).pipe(res);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Download failed' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
