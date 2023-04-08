const nodemailer = require('nodemailer');
const ejs = require('ejs');
const path = require('path');

// Create SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Send payment receipt email
const sendPaymentReceiptEmail = async (user, payment) => {
  try {
    const html = await ejs.renderFile(path.join(__dirname, '..', 'views', 'email', 'payment-receipt.ejs'), {
      name: user.name,
      amount: payment.amount,
      date: payment.date,
    });
    const mailOptions = {
      from: `"AutoCost" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: 'AutoCost - Payment receipt',
      html,
    };
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.log(err);
  }
};

// Send payment reminder email
const sendPaymentReminderEmail = async (user) => {
  try {
    const html = await ejs.renderFile(path.join(__dirname, '..', 'views', 'email', 'payment-reminder.ejs'), {
      name: user.name,
      days: process.env.PAYMENT_REMINDER_DAYS,
    });
    const mailOptions = {
      from: `"AutoCost" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: 'AutoCost - Payment reminder',
      html,
    };
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.log(err);
  }
};

module.exports = { sendPaymentReceiptEmail, sendPaymentReminderEmail };
