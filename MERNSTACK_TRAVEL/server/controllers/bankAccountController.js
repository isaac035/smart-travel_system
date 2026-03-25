const BankAccount = require('../models/BankAccount');

// GET /bank-accounts  (public – users need to see where to transfer)
exports.getBankAccounts = async (req, res) => {
  try {
    const accounts = await BankAccount.find().sort({ createdAt: -1 });
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /bank-accounts  (admin only)
exports.createBankAccount = async (req, res) => {
  try {
    const { bankName, accountNumber, branch } = req.body;
    if (!bankName || !accountNumber || !branch)
      return res.status(400).json({ message: 'All fields are required' });
    const account = await BankAccount.create({ bankName, accountNumber, branch });
    res.status(201).json(account);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /bank-accounts/:id  (admin only)
exports.updateBankAccount = async (req, res) => {
  try {
    const { bankName, accountNumber, branch } = req.body;
    const account = await BankAccount.findByIdAndUpdate(
      req.params.id,
      { bankName, accountNumber, branch },
      { new: true, runValidators: true }
    );
    if (!account) return res.status(404).json({ message: 'Not found' });
    res.json(account);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /bank-accounts/:id  (admin only)
exports.deleteBankAccount = async (req, res) => {
  try {
    const account = await BankAccount.findByIdAndDelete(req.params.id);
    if (!account) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
