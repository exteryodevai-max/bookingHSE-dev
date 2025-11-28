import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Header from './Header';
import { AuthContext } from '../../contexts/AuthContext';

// Mock the AuthContext
const mockAuthContextValue = {
  user: null,
  signUp: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  updateProfile: vi.fn(),
  loading: false,
};

const mockAuthContextValueWithUser = {
  user: {
    id: '1',
    email: 'test@example.com',
    user_type: 'client' as const,
    profile: {
      company_name: 'Test Company',
      vat_number: '12345678901',
      fiscal_code: 'TSTCMP12A01H501Z',
      legal_address: {
        street: 'Via Test 123',
        city: 'Milano',
        postal_code: '20100',
        province: 'MI',
        region: 'Lombardia',
        country: 'IT'
      },
      contact_person: {
        first_name: 'Mario',
        last_name: 'Rossi',
        role: 'CEO',
        email: 'mario.rossi@testcompany.com',
        phone: '+39 02 1234567'
      },
      company_size: 'small' as const,
      industry_sector: 'Manufacturing',
      employees_count: 50,
      phone: '+39 02 1234567'
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  signUp: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  updateProfile: vi.fn(),
  loading: false,
};

const renderWithRouter = (component: React.ReactElement, authValue = mockAuthContextValue) => {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={authValue}>
        {component}
      </AuthContext.Provider>
    </MemoryRouter>
  );
};

describe('Header', () => {
  it('renders logo and navigation links', () => {
    renderWithRouter(<Header />);
    
    expect(screen.getByText('BookingHSE')).toBeInTheDocument();
    expect(screen.getByText('Servizi')).toBeInTheDocument();
    expect(screen.getByText('Come Funziona')).toBeInTheDocument();
    expect(screen.getByText('Per Fornitori')).toBeInTheDocument();
  });

  it('shows login and register buttons when user is not authenticated', () => {
    renderWithRouter(<Header />);
    
    expect(screen.getByText('Accedi')).toBeInTheDocument();
    expect(screen.getByText('Registrati')).toBeInTheDocument();
  });

  it('shows user information when authenticated', () => {
    renderWithRouter(<Header />, mockAuthContextValueWithUser);
    
    // Check that the company name is displayed
    expect(screen.getByText('Test Company')).toBeInTheDocument();
    expect(screen.queryByText('Accedi')).not.toBeInTheDocument();
    expect(screen.queryByText('Registrati')).not.toBeInTheDocument();
  });

  it('toggles mobile menu when mobile menu button is clicked', () => {
    renderWithRouter(<Header />);
    
    const mobileMenuButton = screen.getByRole('button', { name: /menu/i });
    expect(mobileMenuButton).toBeInTheDocument();
    
    // Initially mobile menu should not be visible
    expect(screen.queryByText('Servizi')).toBeInTheDocument(); // Desktop menu
    
    // Click mobile menu button to open
    fireEvent.click(mobileMenuButton);
    
    // Mobile menu items should now be visible
    const mobileMenuItems = screen.getAllByText('Servizi');
    expect(mobileMenuItems.length).toBeGreaterThan(1); // Both desktop and mobile versions
  });

  it('has proper accessibility attributes', () => {
    renderWithRouter(<Header />);
    
    const nav = screen.getByRole('navigation');
    const mobileMenuButton = screen.getByRole('button', { name: /menu/i });
    
    expect(nav).toBeInTheDocument();
    expect(mobileMenuButton).toHaveAttribute('aria-expanded', 'false');
    
    // Click to open mobile menu
    fireEvent.click(mobileMenuButton);
    
    expect(mobileMenuButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('shows notifications button when user is authenticated', () => {
    renderWithRouter(<Header />, mockAuthContextValueWithUser);
    
    const notificationsButton = screen.getByLabelText(/notifiche/i);
    expect(notificationsButton).toBeInTheDocument();
  });

  it('calls logout function when logout is clicked', async () => {
    const user = userEvent.setup();
    const mockSignOut = vi.fn();
    const authValueWithSignOut = {
      ...mockAuthContextValueWithUser,
      signOut: mockSignOut,
    };
    
    renderWithRouter(<Header />, authValueWithSignOut);
    
    // Find the user menu button by looking for the button that contains the company name
    const userMenuButton = screen.getByText('Test Company').closest('button');
    expect(userMenuButton).toBeInTheDocument();
    
    await user.click(userMenuButton!);
    
    // Click logout
    const logoutButton = screen.getByText('Esci');
    await user.click(logoutButton);
    
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('renders search input with proper attributes', () => {
    renderWithRouter(<Header />);
    
    const searchInput = screen.getByPlaceholderText('Cerca servizi HSE...');
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute('aria-label', 'Campo di ricerca servizi HSE');
  });
});