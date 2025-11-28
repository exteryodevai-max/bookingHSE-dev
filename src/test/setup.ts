import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock environment variables
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_SUPABASE_URL: 'https://test.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'test-anon-key',
  },
  writable: true,
});

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
  },
  db: {
    createUser: vi.fn(),
    getUserById: vi.fn(),
    updateUserProfile: vi.fn(),
  },
}));

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: vi.fn(),
});

// Mock window object for leaflet
Object.defineProperty(window, 'L', {
  value: {
    map: vi.fn(() => ({
      setView: vi.fn(),
      addLayer: vi.fn(),
      removeLayer: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      remove: vi.fn()
    })),
    tileLayer: vi.fn(() => ({
      addTo: vi.fn()
    })),
    marker: vi.fn(() => ({
      addTo: vi.fn(),
      bindPopup: vi.fn(),
      setLatLng: vi.fn()
    })),
    Icon: {
      Default: {
        prototype: {
          _getIconUrl: vi.fn()
        },
        mergeOptions: vi.fn()
      }
    }
  },
  writable: true
});

// Mock leaflet module completely
vi.mock('leaflet', () => {
  const mockLeaflet = {
    map: vi.fn(() => ({
      setView: vi.fn(),
      addLayer: vi.fn(),
      removeLayer: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      remove: vi.fn()
    })),
    tileLayer: vi.fn(() => ({
      addTo: vi.fn()
    })),
    marker: vi.fn(() => ({
      addTo: vi.fn(),
      bindPopup: vi.fn(),
      setLatLng: vi.fn()
    })),
    Icon: {
      Default: {
        prototype: {
          _getIconUrl: vi.fn()
        },
        mergeOptions: vi.fn()
      }
    }
  };
  return {
    default: mockLeaflet,
    ...mockLeaflet
  };
});

// Mock react-leaflet
vi.mock('react-leaflet', () => ({
  MapContainer: vi.fn(({ children }) => children),
  TileLayer: vi.fn(() => null),
  Marker: vi.fn(() => null),
  Popup: vi.fn(({ children }) => children),
  useMap: vi.fn(() => ({
    setView: vi.fn(),
    addLayer: vi.fn(),
    removeLayer: vi.fn()
  }))
}));