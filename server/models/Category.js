const { Schema, model } = require('mongoose');

const categorySchema = new Schema({
  name: { type: String, required: true, unique: true, maxlength: 60 },
  slug: { type: String, required: true, unique: true },
  parent_id: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
});

module.exports = model('Category', categorySchema);
