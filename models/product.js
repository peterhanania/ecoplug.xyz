const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  user: {

    username: {
    type: String,
    required: true
    },
    id: {
    type: String,
    required: true
    }

  },

  product: {

  name: {
    type: String,
    default: null
  },

  what_does_it_do:{ 
    type: String,
    default: null
  },

  quantity: {
    type: String,
    default: null
  },

  target_customers: {
    type: String,
    default: null
  },

  link: {
    type: String,
    default: null
  },

  display_adress: {
    same: {
    type: String,
    default: false
    },

    other:{
    type: String,
    default: null
    },
  },

  how_are_they_helping: {
    type: String,
    default: null
  }, 
  
  picture_links: {
    type: String,
    default: null
  },

  categories: {
    type: Array,
    default: null
  }


  },

  views: {
    type: Number,
    default: 0
  }
});


module.exports = mongoose.model('Product', userSchema);
