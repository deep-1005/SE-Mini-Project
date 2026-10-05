const catalogueService = require('../services/catalogueService');

module.exports = {
  search: async (req, res) => {
    const { cached, ...result } = await catalogueService.search(req.validatedQuery);
    res.set('X-Cache', cached ? 'HIT' : 'MISS').json(result);
  },
  get: async (req, res) => res.json(await catalogueService.getBook(req.params.id)),
  byIsbn: async (req, res) => res.json(await catalogueService.findByIsbn(req.params.isbn13)),
  related: async (req, res) => res.json(await catalogueService.related(req.params.id)),
  categories: async (req, res) => res.json(await catalogueService.categories()),
};
