const Link = require('../models/Link');
const { isValidUrl, generateRandomCode } = require('../utils/helpers');

// Health check
const healthCheck = (req, res) => {
    const uptime = Math.floor((Date.now() - global.serverStartTime) / 1000);
    res.status(200).json({
        ok: true,
        version: '1.0',
        uptime: uptime,
        timestamp: new Date().toISOString()
    });
};

// Create a new link
const createLink = async (req, res) => {
    try {
        const { targetUrl, code } = req.body;

        // Validate target URL
        if (!targetUrl) {
            return res.status(400).json({ error: 'targetUrl is required' });
        }

        if (!isValidUrl(targetUrl)) {
            return res.status(400).json({ error: 'Invalid URL format' });
        }

        // Generate or validate code
        let shortCode = code;

        if (shortCode) {
            if (!/^[A-Za-z0-9]{6,8}$/.test(shortCode)) {
                return res.status(400).json({
                    error: 'Code must be 6-8 alphanumeric characters'
                });
            }

            // Check if code already exists
            const existingLink = await Link.findOne({ where: { code: shortCode } });
            if (existingLink) {
                return res.status(409).json({
                    error: 'Code already exists. Please choose a different code.'
                });
            }
        } else {
            let attempts = 0;
            const maxAttempts = 10;

            while (attempts < maxAttempts) {
                shortCode = generateRandomCode(6);
                const existingLink = await Link.findOne({ where: { code: shortCode } });
                if (!existingLink) break;
                attempts++;
            }

            if (attempts === maxAttempts) {
                return res.status(500).json({
                    error: 'Failed to generate unique code. Please try again.'
                });
            }
        }

        // Create the link
        const newLink = await Link.create({
            code: shortCode,
            targetUrl: targetUrl,
            totalClicks: 0
        });

        return res.status(201).json({
            id: newLink.id,
            code: newLink.code,
            targetUrl: newLink.targetUrl,
            totalClicks: newLink.totalClicks,
            lastClickedAt: newLink.lastClickedAt,
            createdAt: newLink.createdAt,
            updatedAt: newLink.updatedAt
        });
    } catch (error) {
        console.error('Error creating link:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// Get all links
const getAllLinks = async (req, res) => {
    try {
        const links = await Link.findAll({
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json(links.map(link => ({
            id: link.id,
            code: link.code,
            targetUrl: link.targetUrl,
            totalClicks: link.totalClicks,
            lastClickedAt: link.lastClickedAt,
            createdAt: link.createdAt,
            updatedAt: link.updatedAt
        })));
    } catch (error) {
        console.error('Error fetching links:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// Get stats for a specific link
const getLinkByCode = async (req, res) => {
    try {
        const { code } = req.params;

        const link = await Link.findOne({ where: { code } });

        if (!link) {
            return res.status(404).json({ error: 'Link not found' });
        }

        return res.status(200).json({
            id: link.id,
            code: link.code,
            targetUrl: link.targetUrl,
            totalClicks: link.totalClicks,
            lastClickedAt: link.lastClickedAt,
            createdAt: link.createdAt,
            updatedAt: link.updatedAt
        });
    } catch (error) {
        console.error('Error fetching link:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete a link
const deleteLink = async (req, res) => {
    try {
        const { code } = req.params;
        const link = await Link.findOne({ where: { code } });

        if (!link) {
            return res.status(404).json({ error: 'Link not found' });
        }

        await link.destroy();

        return res.status(200).json({
            message: 'Link deleted successfully',
            code: code
        });
    } catch (error) {
        console.error('Error deleting link:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Redirect to original URL
const redirectLink = async (req, res) => {
    try {
        const { code } = req.params;

        const link = await Link.findOne({ where: { code } });

        if (!link) {
            return res.status(404).json({ error: 'Link not found' });
        }

        link.totalClicks += 1;
        link.lastClickedAt = new Date();
        await link.save();

        return res.redirect(302, link.targetUrl);
    } catch (error) {
        console.error('Error redirecting:', error);
       return res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    healthCheck,
    createLink,
    getAllLinks,
    getLinkByCode,
    deleteLink,
    redirectLink
};