import { render, screen } from '@testing-library/react';
import MapPanel from '../MapPanel';

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

describe('MapPanel Component', () => {
  it('renders the VenueSync title pill', () => {
    render(
      <MapPanel 
        activeNodeId={null} 
        stressLevel={1.0} 
        nodes={mockNodes} 
        isChatOpen={true} 
      />
    );
    expect(screen.getByText(/Venue/i)).toBeInTheDocument();
    expect(screen.getByText(/Sync/i)).toBeInTheDocument();
  });

  it('renders the Venue Switcher with correct aria-label', () => {
    render(
      <MapPanel 
        activeNodeId={null} 
        stressLevel={1.0} 
        nodes={mockNodes} 
        isChatOpen={true} 
      />
    );
    const select = screen.getByLabelText(/Select Venue \/ Event Site/i);
    expect(select).toBeInTheDocument();
  });

  it('shows critical evacuation text when stress level is high', () => {
    render(
      <MapPanel 
        activeNodeId={null} 
        stressLevel={2.5} 
        nodes={mockNodes} 
        isChatOpen={true} 
      />
    );
    expect(screen.getByText(/ENACTING PROTOCOL/i)).toBeInTheDocument();
  });
});
