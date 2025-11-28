import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from './LoginPage';
import { AuthContext } from '../../contexts/AuthContext';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockAuthContextValue = {
  user: null,
  signUp: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  updateProfile: vi.fn(),
  loading: false,
};

const renderWithRouter = (component: React.ReactElement, authValue = mockAuthContextValue) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={authValue}>
        {component}
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('LoginPage', () => {
  beforeEach(() => {
    mockAuthContextValue.signIn.mockClear();
    mockNavigate.mockClear();
  });

  it('renders login form with all required fields', () => {
    renderWithRouter(<LoginPage />);
    
    expect(screen.getByText('Accedi al tuo account')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /accedi/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup();
    renderWithRouter(<LoginPage />);
    
    const submitButton = screen.getByRole('button', { name: /accedi/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Email è richiesta')).toBeInTheDocument();
      expect(screen.getByText('Password è richiesta')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows validation error for invalid email format', async () => {
    const user = userEvent.setup();
    renderWithRouter(<LoginPage />);
    
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /accedi/i });
    
    await user.type(emailInput, 'test');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Email non valida')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('calls login function with correct credentials when form is submitted', async () => {
    const user = userEvent.setup();
    const mockSignIn = vi.fn().mockResolvedValue({ user: { id: '1' }, error: null });
    const authValue = { ...mockAuthContextValue, signIn: mockSignIn };
    
    renderWithRouter(<LoginPage />, authValue);
    
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /accedi/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('shows loading state during login', async () => {
    const user = userEvent.setup();
    const mockSignIn = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    const authValue = { ...mockAuthContextValue, signIn: mockSignIn };
    
    renderWithRouter(<LoginPage />, authValue);
    
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /accedi/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    expect(screen.getByText('Accesso in corso...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('displays error message when login fails', async () => {
    const user = userEvent.setup();
    const mockSignIn = vi.fn().mockResolvedValue({ 
      user: null, 
      error: { message: 'Invalid credentials' } 
    });
    const authValue = { ...mockAuthContextValue, signIn: mockSignIn };
    
    renderWithRouter(<LoginPage />, authValue);
    
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /accedi/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('toggles password visibility when eye icon is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<LoginPage />);
    
    const passwordInput = screen.getByLabelText('Password');
    const toggleButton = screen.getByLabelText('Mostra password');
    
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText('Nascondi password')).toBeInTheDocument();
    
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('has proper accessibility attributes', () => {
    renderWithRouter(<LoginPage />);
    
    const form = screen.getByRole('form');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    
    expect(form).toBeInTheDocument();
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('navigates to register page when register link is clicked', async () => {
    renderWithRouter(<LoginPage />);
    
    const registerLink = screen.getByText('Registrati qui');
    expect(registerLink).toBeInTheDocument();
    expect(registerLink).toHaveAttribute('href', '/auth/register');
  });
});