const express = require('express');
const router = express.Router();
const {
  healthCheck,
  createLink,
  getAllLinks,
  getLinkByCode,
  deleteLink,
  redirectLink
} = require('../controllers/linkController');

// Health check endpoint
router.get('/healthz', healthCheck);

// API routes
router.post('/api/links', createLink);
router.get('/api/links', getAllLinks);
router.get('/api/links/:code', getLinkByCode);
router.delete('/api/links/:code', deleteLink);


router.get('/:code', redirectLink);

module.exports = router;