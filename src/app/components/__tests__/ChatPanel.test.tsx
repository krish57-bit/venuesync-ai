import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatPanel from '../ChatPanel';
import { sendGAEvent } from '@next/third-parties/google';

// Mock Google Analytics
jest.mock('@next/third-parties/google', () => ({
  sendGAEvent: jest.fn(),
}));

const mockNodes = [
  {
    node_id: "E1",
    label: "Exit North",
    type: "Exit",
    coordinates: { lat: 30.7333, lng: 76.7794 },
    base_processing_time: 10,
    density_multiplier: 1.0,
    elevation_level: 0,
    pending_arrivals: 0,
  }
];

describe('ChatPanel Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the initial assistant message', () => {
    render(
      <ChatPanel 
        onRouteAssigned={jest.fn()} 
        stressLevel={1.0} 
        setStressLevel={jest.fn()} 
        nodes={mockNodes} 
      />
    );
    expect(screen.getByText(/Welcome to VenueSync AI/i)).toBeInTheDocument();
  });

  it('updates input field when typing', () => {
    render(
      <ChatPanel 
        onRouteAssigned={jest.fn()} 
        stressLevel={1.0} 
        setStressLevel={jest.fn()} 
        nodes={mockNodes} 
      />
    );
    const input = screen.getByPlaceholderText(/Initialize query/i);
    fireEvent.change(input, { target: { value: 'How do I exit?' } });
    expect(input).toHaveValue('How do I exit?');
  });

  it('calls handleSend and triggers GA event on button click', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reply: 'Go to Exit North', targetNodeId: 'E1' }),
    });

    render(
      <ChatPanel 
        onRouteAssigned={jest.fn()} 
        stressLevel={1.0} 
        setStressLevel={jest.fn()} 
        nodes={mockNodes} 
      />
    );

    const input = screen.getByPlaceholderText(/Initialize query/i);
    fireEvent.change(input, { target: { value: 'Find exit' } });
    
    const sendButton = screen.getByLabelText(/Send message/i);
    fireEvent.click(sendButton);

    expect(sendGAEvent).toHaveBeenCalledWith({
      event: 'chat_message_sent',
      value: 'Find exit'.length,
    });

    await waitFor(() => {
      expect(screen.getByText(/Go to Exit North/i)).toBeInTheDocument();
    });
  });

  it('sanitizes input before sending', async () => {
    render(
      <ChatPanel 
        onRouteAssigned={jest.fn()} 
        stressLevel={1.0} 
        setStressLevel={jest.fn()} 
        nodes={mockNodes} 
      />
    );

    const input = screen.getByPlaceholderText(/Initialize query/i);
    fireEvent.change(input, { target: { value: '<script>alert(1)</script>' } });
    
    // The value in the input state should be sanitized when handleSend is called.
    // However, the setInput("") happens immediately in handleSend.
    // We can check if the rendered message (the user bubbles) are sanitized.
    
    const sendButton = screen.getByLabelText(/Send message/i);
    fireEvent.click(sendButton);

    expect(screen.getByText(/&lt;script&gt;alert\(1\)&lt;\/script&gt;/i)).toBeInTheDocument();
  });
});
