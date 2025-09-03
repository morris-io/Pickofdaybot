// pages/api/create-checkout-session.js
import { stripe }            from '../../lib/stripe';
import { getServerSession }  from 'next-auth/next';
import { authOptions }       from './auth/[...nextauth]';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'Not authenticated' });

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
    success_url: `${process.env.NEXTAUTH_URL}/dashboard`,
    cancel_url:  `${process.env.NEXTAUTH_URL}/dashboard`,
  });

  res.status(200).json({ url: checkoutSession.url });
}
