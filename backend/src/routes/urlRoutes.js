const { Router } = require('express');
const { createShortUrl, deleteShortUrl } = require('../controllers/urlController');
const { validateCreateUrl } = require('../middleware/validateCreateUrl');

const router = Router();

router.post('/urls', validateCreateUrl, createShortUrl);
router.delete('/urls/:shortCode', deleteShortUrl);

module.exports = router;
