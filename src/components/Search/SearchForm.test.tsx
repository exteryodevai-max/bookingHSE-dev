import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchForm from './SearchForm';

// Mock the geocoding service to prevent API calls
vi.mock('../../lib/geocoding', () => ({
  geocodingService: {
    searchPlaces: vi.fn().mockResolvedValue([]),
    reverseGeocode: vi.fn().mockResolvedValue(null),
    geocode: vi.fn().mockResolvedValue([])
  },
  formatAddress: vi.fn((address) => address?.city || 'Test City')
}));

// Mock the geolocation hook
vi.mock('../../hooks/useGeolocation', () => ({
  useGeolocation: () => ({
    getCurrentPosition: vi.fn().mockResolvedValue({
      coords: { latitude: 41.9028, longitude: 12.4964 }
    }),
    loading: false
  })
}));

// Mock the Map component
vi.mock('../Map/Map', () => ({
  default: vi.fn(() => null)
}));

// Mock the LocationPicker component to avoid complex interactions
vi.mock('../Map/LocationPicker', () => ({
  default: vi.fn(({ value, onChange, placeholder }) => (
    <input
      type="text"
      placeholder={placeholder}
      value={value?.address || ''}
      onChange={(e) => onChange({
        address: e.target.value,
        coordinates: { lat: 41.9028, lng: 12.4964 }
      })}
    />
  ))
}));

const mockOnSearch = vi.fn();
const mockOnFiltersChange = vi.fn();

const defaultProps = {
  onSearch: mockOnSearch,
  onFiltersChange: mockOnFiltersChange,
  initialFilters: {
    query: '',
    location: {
      city: '',
    },
    category: undefined,
  },
};

describe('SearchForm', () => {
  beforeEach(() => {
    mockOnSearch.mockClear();
    mockOnFiltersChange.mockClear();
  });

  it('renders all form elements correctly', () => {
    render(<SearchForm {...defaultProps} />);
    
    expect(screen.getByPlaceholderText('es. Formazione sicurezza, DVR...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Città, provincia...')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Tutte le categorie')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cerca/i })).toBeInTheDocument();
  });

  it('displays initial values correctly', () => {
    const props = {
      ...defaultProps,
      initialFilters: {
        query: 'test query',
        location: {
          city: 'test location',
        },
        category: 'workplace_safety',
      },
    };
    
    render(<SearchForm {...props} />);
    
    expect(screen.getByDisplayValue('test query')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test location')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Sicurezza sul Lavoro')).toBeInTheDocument();
  });

  it('calls onSearch with correct parameters when form is submitted', async () => {
    const user = userEvent.setup();
    render(<SearchForm {...defaultProps} />);
    
    const queryInput = screen.getByPlaceholderText('es. Formazione sicurezza, DVR...');
    const locationInput = screen.getByPlaceholderText('Città, provincia...');
    const categorySelect = screen.getByRole('combobox');
    const submitButton = screen.getByRole('button', { name: /cerca/i });
    
    await user.type(queryInput, 'test service');
    await user.type(locationInput, 'test city');
    await user.selectOptions(categorySelect, 'workplace_safety');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        query: 'test service',
        location: {
          city: 'test city',
          coordinates: { lat: 41.9028, lng: 12.4964 },
          radius_km: 50
        },
        category: 'workplace_safety',
      });
      expect(mockOnSearch).toHaveBeenCalled();
    });
  });

  it('prevents form submission when required fields are empty', async () => {
    const user = userEvent.setup();
    render(<SearchForm {...defaultProps} />);
    
    const submitButton = screen.getByRole('button', { name: /cerca/i });
    await user.click(submitButton);
    
    expect(mockOnSearch).not.toHaveBeenCalled();
  });

  it('updates input values when user types', async () => {
    const user = userEvent.setup();
    render(<SearchForm {...defaultProps} />);
    
    const queryInput = screen.getByPlaceholderText('es. Formazione sicurezza, DVR...');
    
    await user.type(queryInput, 'new query');
    
    expect(queryInput).toHaveValue('new query');
  });

  it('has proper accessibility attributes', () => {
    render(<SearchForm {...defaultProps} />);
    
    const form = screen.getByRole('search');
    const submitButton = screen.getByRole('button', { name: /cerca/i });
    
    expect(form).toBeInTheDocument();
    expect(submitButton).toHaveAttribute('type', 'submit');
  });
});