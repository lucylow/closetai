// backend/services/stripeService.js
// Small Stripe integration: createCustomer, createCheckoutSession, webhook handler
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const YOUR_DOMAIN = process.env.CLIENT_BASE_URL || "http://localhost:3000";
async function createCustomer(email, metadata) { return stripe.customers.create({ email, metadata }); }
async function createCheckoutSession({ customerId, priceId, successUrl, cancelUrl, metadata }) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata,
    success_url: successUrl || YOUR_DOMAIN + "/payments/success?session_id={CHECKOUT_SESSION_ID}",
    cancel_url: cancelUrl || YOUR_DOMAIN + "/payments/cancel"
  });
  return session;
}
function verifyWebhook(rawBody, sigHeader, webhookSecret) {
  try { const event = stripe.webhooks.constructEvent(rawBody, sigHeader, webhookSecret); return { ok: true, event }; }
  catch (err) { return { ok: false, error: err }; }
}
async function handleCheckoutSessionCompleted(session, db) {
  const metadata = session.metadata || {};
  const tenantId = metadata.tenantId;
  const userId = metadata.userId;
  const packCredits = metadata.credits ? Number(metadata.credits) : 0;
  if (packCredits > 0) {
    await db.query("INSERT INTO credits_ledger (tenant_id, user_id, change, reason, created_at) VALUES ($1,$2,$3,$4,now())", [tenantId, userId, packCredits, "stripe_session:" + session.id]);
  }
  return { ok: true };
}
module.exports = { createCustomer, createCheckoutSession, verifyWebhook, handleCheckoutSessionCompleted };
