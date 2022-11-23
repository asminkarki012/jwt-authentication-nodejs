const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const quoteSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  quote: {
    type: String,
    required: true,
  },
});

const Quote = mongoose.model("Quote", quoteSchema);
module.exports = Quote;
