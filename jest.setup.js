import '@testing-library/jest-dom';

// Mock mapbox-gl
jest.mock('mapbox-gl', () => ({
  Map: jest.fn(() => ({
    on: jest.fn(),
    remove: jest.fn(),
    flyTo: jest.fn(),
    resize: jest.fn(),
    addControl: jest.fn(),
    getCanvas: jest.fn(() => ({
      style: {
        cursor: ''
      }
    }))
  })),
  NavigationControl: jest.fn(),
  Marker: jest.fn(() => ({
    setLngLat: jest.fn().mockReturnThis(),
    addTo: jest.fn().mockReturnThis(),
    remove: jest.fn().mockReturnThis(),
    getElement: jest.fn(() => document.createElement('div')),
  })),
  accessToken: '',
}));

// Mock ResizeObserver for framer-motion/mapbox
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock scrollTo for JSDOM
Element.prototype.scrollTo = jest.fn();

// Mock fetch for Gemini API and Mapbox token
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
);
