const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Payment = require('../models/payment');

// Process payments for a user
const processPayments = async (user, amount) => {
  try {
    // Charge credit card using Stripe API
    const charge = await stripe.charges.create({
      amount: amount * 100, // Amount in cents
      currency: 'usd',
      source: user.stripeCustomerId,
      description: 'AutoCost Subscription',
    });

    // Save payment in database
    const payment = new Payment({ user: user._id, amount });
    await payment.save();

    // Mark all previous unprocessed payments as processed
    await Payment.updateMany({ user: user._id, processed: false }, { processed: true });

    return charge;
  } catch (err) {
    console.log(err);
    throw new Error('Error processing payment');
  }
};

module.exports = { processPayments };
