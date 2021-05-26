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

  },

  title: {

  },

  summary: {

  }, 

  description: {

  },

  thumbnail: {
    
  }

  }

});


module.exports = mongoose.model('Queue', userSchema);
