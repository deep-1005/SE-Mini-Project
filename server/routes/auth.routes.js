// FR-01 to FR-04. Mounted at /api/v1/auth.
const router = require('express').Router();
const h = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { loginLimiter } = require('../middleware/rateLimit');
const s = require('../validators/auth.schema');
const auth = require('../controllers/authController');
const password = require('../controllers/passwordController');

router.post('/register', validate(s.register), h(auth.register));
router.post('/verify-otp', validate(s.verifyOtp), h(auth.verifyOtp));
router.post('/resend-otp', validate(s.emailOnly), h(auth.resendOtp));
router.post('/login', loginLimiter, validate(s.login), h(auth.login));
router.post('/refresh', h(auth.refresh));
router.post('/logout', h(auth.logout));
router.post('/forgot-password', validate(s.emailOnly), h(password.forgot));
router.post('/reset-password', validate(s.resetPassword), h(password.reset));

module.exports = router;
