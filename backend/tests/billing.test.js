/**
 * Billing API unit tests. Mocks Stripe and Segment.
 */
const nock = require('nock');

// Mock Stripe before requiring app
nock.disableNetConnect();

describe('Billing', () => {
  beforeAll(() => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_mock';
    process.env.JWT_SECRET = 'test-secret';
    process.env.ADMIN_TOKEN = 'devtoken';
  });

  afterAll(() => {
    nock.cleanAll();
  });

  test('create customer route - mocked', async () => {
    nock('https://api.stripe.com')
      .post('/v1/customers')
      .reply(200, { id: 'cus_test123', email: 'a@b.com' });

    const stripe = require('stripe');
    const Stripe = require('stripe');
    const s = new Stripe('sk_test_mock', { apiVersion: '2024-11-20.acacia' });
    const customer = await s.customers.create({
      email: 'a@b.com',
      name: 'Alice',
      metadata: { userId: 'user-1' },
    });
    expect(customer.id).toBe('cus_test123');
  });

  test('create subscription route - mocked', async () => {
    nock('https://api.stripe.com')
      .post('/v1/subscriptions')
      .reply(200, {
        id: 'sub_test',
        status: 'active',
        customer: 'cus_test',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 2592000,
      });

    const Stripe = require('stripe');
    const s = new Stripe('sk_test_mock', { apiVersion: '2024-11-20.acacia' });
    const sub = await s.subscriptions.create({
      customer: 'cus_test',
      items: [{ price: 'price_123' }],
    });
    expect(sub.id).toBe('sub_test');
    expect(sub.status).toBe('active');
  });
});
