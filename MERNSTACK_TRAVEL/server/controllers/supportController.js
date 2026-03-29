const SupportRequest = require('../models/SupportRequest');

// POST /api/support  — user creates a support request
exports.createSupportRequest = async (req, res) => {
  try {
    const { subject, message } = req.body;

    if (!subject || subject.trim().length < 3) {
      return res.status(400).json({ message: 'Subject must be at least 3 characters.' });
    }
    if (subject.trim().length > 150) {
      return res.status(400).json({ message: 'Subject must be 150 characters or fewer.' });
    }
    if (!message || message.trim().length < 10) {
      return res.status(400).json({ message: 'Message must be at least 10 characters.' });
    }
    if (message.trim().length > 2000) {
      return res.status(400).json({ message: 'Message must be 2000 characters or fewer.' });
    }

    const request = await SupportRequest.create({
      userId: req.user._id,
      subject: subject.trim(),
      message: message.trim(),
    });

    res.status(201).json(request);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// GET /api/support/my  — user gets their own requests
exports.getMySupportRequests = async (req, res) => {
  try {
    const requests = await SupportRequest.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
