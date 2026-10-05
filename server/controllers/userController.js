const userService = require('../services/userService');

module.exports = {
  me: async (req, res) => res.json({ user: await userService.getMe(req.user.id) }),
  updateMe: async (req, res) => res.json({ user: await userService.updateMe(req.user.id, req.body) }),
  listAddresses: async (req, res) => res.json(await userService.listAddresses(req.user.id)),
  addAddress: async (req, res) => res.status(201).json({ address: await userService.addAddress(req.user.id, req.body) }),
  updateAddress: async (req, res) => res.json({ address: await userService.updateAddress(req.user.id, req.params.id, req.body) }),
  deleteAddress: async (req, res) => {
    await userService.deleteAddress(req.user.id, req.params.id);
    res.status(204).end();
  },
};
