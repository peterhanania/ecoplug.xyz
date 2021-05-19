const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const productSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  addedBy: {
    type: String,
    required: true
  },
  price: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  tags: {
     type: Array,
    required: true
  },
  date: {
    type: Number,
    required: true
  },
  views: {
    type: Number,
    required: true
  },
  type: {
        type: String,
    required: true
  },
  summary: {
        type: String,
  },
});

module.exports = mongoose.model('Bots', productSchema);
