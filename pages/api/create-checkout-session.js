// pages/api/create-checkout-session.js
import { stripe }            from '../../lib/stripe';
import { getServerSession }  from 'next-auth/next';
import { authOptions }       from './auth/[...nextauth]';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'Not authenticated' });

  // Use the new environment variable for your custom domain.
  // Fallback to a default for local development if it's not set.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price: process.env.STRIPE_PRICE_ID,
        quantity: 1
      }],
      customer_email: session.user.email,
      subscription_data: {
        trial_period_days: 7
      },
      // --- UPDATED LINES ---
      // Use the new siteUrl variable to ensure the correct domain is used.
      success_url: `${siteUrl}/dashboard`,
      cancel_url:  `${siteUrl}/dashboard`,
    });

    res.status(200).json({ url: checkoutSession.url });

  } catch (err) {
    console.error("Stripe Error:", err.message);
    res.status(500).json({ error: 'Unable to start checkout.', message: err.message });
  }
}