const { Router } = require('express');
const { createShortUrl } = require('../controllers/urlController');
const { validateCreateUrl } = require('../middleware/validateCreateUrl');

const router = Router();

router.post('/urls', validateCreateUrl, createShortUrl);

module.exports = router;
