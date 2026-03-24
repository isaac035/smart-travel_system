const mongoose = require('mongoose');

const bankAccountSchema = new mongoose.Schema(
  {
    bankName:      { type: String, required: true, trim: true },
    accountNumber: { type: String, required: true, trim: true },
    branch:        { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BankAccount', bankAccountSchema);
