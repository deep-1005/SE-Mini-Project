const router = require('express').Router();

router.use(require('./health.routes'));
router.use('/auth', require('./auth.routes'));
router.use('/users', require('./user.routes'));
router.use(require('./book.routes'));
// Sprint 2: cart, wishlist, order, payment routes (G H Pramod); seller routes (Hardhick M Gowda).
// Sprint 3: admin routes, reviews.

module.exports = router;
