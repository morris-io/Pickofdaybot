// pages/api/create-checkout-session.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      // Get the site URL from the new environment variable.
      // Fallback to localhost for local development.
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

      // Create the Checkout Session
      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price: process.env.STRIPE_PRICE_ID, // Your price ID from the Stripe dashboard
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${siteUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl}/`, // Use the siteUrl for the cancel URL
        metadata: {
          // If you need to associate the checkout with a user, add their ID here
          // userId: req.body.userId 
        },
      });

      res.status(200).json({ url: session.url });
    } catch (err) {
      console.error('Stripe Error:', err.message);
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}