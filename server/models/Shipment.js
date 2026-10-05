const { Schema, model } = require('mongoose');

const shipmentSchema = new Schema({
  order_id: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  order_item_id: { type: Schema.Types.ObjectId, ref: 'OrderItem', required: true },
  courier: { type: String, required: true, maxlength: 60 },
  tracking_no: { type: String, required: true, maxlength: 40 },
  dispatch_date: { type: Date, required: true, default: Date.now },
});

module.exports = model('Shipment', shipmentSchema);
