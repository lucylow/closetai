import { render, screen, fireEvent } from '@testing-library/react';
import SponsorsPage from '../pages/Sponsors';
import api from '../lib/api';

// Mock the api module
jest.mock('../lib/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

const mockApi = api as jest.Mocked<typeof api>;

describe('SponsorsPage', () => {
  const mockSponsors = [
    { id: 'perfectcorp', name: 'Perfect Corp', description: 'Virtual Try-On provider', logoUrl: '/assets/sponsors/perfectcorp.png', connected: false, mode: 'none' },
    { id: 'youcom', name: 'You.com', description: 'Search / embeddings', logoUrl: '/assets/sponsors/youcom.png', connected: false, mode: 'none' },
    { id: 'openai', name: 'OpenAI', description: 'Text & image generation', logoUrl: '/assets/sponsors/openai.png', connected: false, mode: 'none' },
    { id: 'stripe', name: 'Stripe', description: 'Payments provider', logoUrl: '/assets/sponsors/stripe.png', connected: false, mode: 'none' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (mockApi.get as jest.Mock).mockResolvedValue({ sponsors: mockSponsors });
  });

  it('renders sponsor page with title', async () => {
    render(<SponsorsPage />);
    expect(screen.getByText('Sponsor Integrations')).toBeInTheDocument();
  });

  it('loads and displays sponsors', async () => {
    render(<SponsorsPage />);
    await screen.findByText('Perfect Corp');
    expect(screen.getByText('You.com')).toBeInTheDocument();
    expect(screen.getByText('OpenAI')).toBeInTheDocument();
    expect(screen.getByText('Stripe')).toBeInTheDocument();
  });

  it('shows connect button for each sponsor', async () => {
    render(<SponsorsPage />);
    await screen.findByText('Perfect Corp');
    const connectButtons = screen.getAllByText('Connect');
    expect(connectButtons).toHaveLength(4);
  });

  it('opens modal when connect is clicked', async () => {
    render(<SponsorsPage />);
    await screen.findByText('Perfect Corp');
    fireEvent.click(screen.getAllByText('Connect')[0]);
    expect(screen.getByText('Connect perfectcorp')).toBeInTheDocument();
  });
});
