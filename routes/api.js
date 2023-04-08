const express = require('express');
const router = express.Router();
const { S3 } = require('../config/aws');
const Payment = require('../models/payment');
const User = require('../models/user');
const { sendPaymentReminderEmail } = require('../utils/email');
const { processPayments } = require('../utils/payments');

// Get S3 usage for user
router.get('/usage', async (req, res) => {
  try {
    const s3UsageResponse = await S3.listObjectsV2({ Bucket: process.env.S3_BUCKET_NAME }).promise();
    const totalBytes = s3UsageResponse.Contents.reduce((acc, curr) => acc + curr.Size, 0);
    const totalGB = parseFloat((totalBytes / Math.pow(1024, 3)).toFixed(2));
    const amount = parseFloat((totalGB * process.env.COST_PER_GB).toFixed(2));
    res.json({ totalGB, amount });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Error fetching S3 usage' });
  }
});

// Process payments
router.post('/process-payments', async (req, res) => {
  try {
    const users = await User.find({});
    for (const user of users) {
      const payments = await Payment.find({ user: user._id, processed: false }).sort({ createdAt: -1 });
      const totalAmount = payments.reduce((acc, curr) => acc + curr.amount, 0);
      if (totalAmount > 0) {
        // Process payment
        await processPayments(user, totalAmount);

        // Send payment receipt email
        const payment = await Payment.findOne({ user: user._id }).sort({ createdAt: -1 });
        sendPaymentReceiptEmail(user, payment);

        res.json({ message: 'Payments processed successfully' });
      } else {
        // Send payment reminder email
        const lastPayment = payments[0];
        if (lastPayment) {
          const daysSinceLastPayment = moment().diff(moment(lastPayment.date), 'days');
          if (daysSinceLastPayment >= parseInt(process.env.PAYMENT_REMINDER_DAYS)) {
            sendPaymentReminderEmail(user);
          }
        } else {
          sendPaymentReminderEmail(user);
        }

        res.json({ message: 'No payments to process' });
      }
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Error processing payments' });
  }
});

module.exports = router;
