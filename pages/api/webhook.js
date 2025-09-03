// pages/api/webhook.js
import { stripe }         from '../../lib/stripe';
import { buffer }         from 'micro';
import clientPromise      from '../../lib/mongodb';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  const sig = req.headers['stripe-signature'];
  const buf = await buffer(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const db = (await clientPromise).db().collection('users');

  switch (event.type) {
    case 'checkout.session.completed': {
      const sess = event.data.object;
      await db.updateOne(
        { email: sess.customer_email },
        { $set: { isSubscribed: true, subscriptionId: sess.subscription } }
      );
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      await db.updateOne(
        { subscriptionId: sub.id },
        { $set: { isSubscribed: false } }
      );
      break;
    }
    // (optionally handle updated, expired, etc.)
  }

  res.json({ received: true });
}
