// FR-05. Mounted at /api/v1/users.
const router = require('express').Router();
const h = require('../utils/asyncHandler');
const verifyJWT = require('../middleware/verifyJWT');
const authorizeRoles = require('../middleware/authorizeRoles');
const validate = require('../middleware/validate');
const s = require('../validators/user.schema');
const c = require('../controllers/userController');

router.use(verifyJWT);
router.get('/me', h(c.me));
router.patch('/me', validate(s.updateMe), h(c.updateMe));
router.get('/me/addresses', authorizeRoles('BUYER'), h(c.listAddresses));
router.post('/me/addresses', authorizeRoles('BUYER'), validate(s.addAddress), h(c.addAddress));
router.patch('/me/addresses/:id', authorizeRoles('BUYER'), validate(s.updateAddress), h(c.updateAddress));
router.delete('/me/addresses/:id', authorizeRoles('BUYER'), validate(s.addressId), h(c.deleteAddress));

module.exports = router;
