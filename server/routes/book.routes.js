// FR-07 to FR-10, FR-12. Mounted at /api/v1.
const router = require('express').Router();
const h = require('../utils/asyncHandler');
const verifyJWT = require('../middleware/verifyJWT');
const authorizeRoles = require('../middleware/authorizeRoles');
const validate = require('../middleware/validate');
const s = require('../validators/book.schema');
const c = require('../controllers/bookController');

router.get('/books', validate(s.search), h(c.search));
router.get('/books/isbn/:isbn13', verifyJWT, authorizeRoles('SELLER', 'ADMIN'), validate(s.isbn), h(c.byIsbn));
router.get('/books/:id', validate(s.bookId), h(c.get));
router.get('/books/:id/related', validate(s.bookId), h(c.related));
router.get('/categories', h(c.categories));

module.exports = router;
