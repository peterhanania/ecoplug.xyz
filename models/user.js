const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  joinedAt:{
    type: Date,
    required: false
  },
  profile: {

    image: {
    type: String,
    default: null
    },

    settings: {
      
      news_and_updates :{
      type: Boolean,
      default: false
      },

      product_updates :{
      type: Boolean,
      default: false
      },

      account_changes :{
      type: Boolean,
      default: false
      },

      weekly_statistics :{
      type: Boolean,
      default: false
      },




    }

  },
  resetToken: String,
  resetTokenExpiration: Date,
});


module.exports = mongoose.model('User', userSchema);
