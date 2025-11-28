import React, { useState, useCallback, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  MagnifyingGlassIcon,
  UserCircleIcon,
  BellIcon,
  Bars3Icon,
  XMarkIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';

const navigation = [
  { name: 'Servizi', href: '/services' },
  { name: 'Come Funziona', href: '/how-it-works' },
  { name: 'Per Fornitori', href: '/for-providers' },
];

const Header = memo(function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Errore durante il logout:', error);
      // In caso di errore, naviga comunque alla home page
      navigate('/');
    }
  }, [signOut, navigate]);

  const handleSearchClick = useCallback(() => {
    navigate('/search');
  }, [navigate]);

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      navigate('/search');
    }
  }, [navigate]);

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(prev => !prev);
  }, []);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">BookingHSE</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </nav>



          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Notifications */}
                <button 
                  className="p-2 text-gray-400 hover:text-gray-500 relative"
                  aria-label="Notifiche - Hai nuove notifiche"
                >
                  <BellIcon className="h-6 w-6" aria-hidden="true" />
                  <span 
                    className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white" 
                    aria-hidden="true"
                  />
                </button>

                {/* User Dropdown */}
                <Menu as="div" className="relative">
                  <Menu.Button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50">
                    <div className="relative h-8 w-8">
                      {(user.profile as { profile_image_url?: string })?.profile_image_url ? (
                        <>
                          <img
                            src={(user.profile as { profile_image_url?: string }).profile_image_url}
                            alt="Avatar utente"
                            className="h-8 w-8 rounded-full object-cover border border-gray-200"
                            onError={(e) => {
                              // Fallback to icon if image fails to load
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const icon = target.nextElementSibling as HTMLElement;
                              if (icon) icon.style.display = 'block';
                            }}
                          />
                          <UserCircleIcon 
                            className="h-8 w-8 text-gray-400 hidden" 
                          />
                        </>
                      ) : (
                        <UserCircleIcon 
                          className="h-8 w-8 text-gray-400" 
                        />
                      )}
                    </div>
                    <span className="hidden md:block text-sm font-medium text-gray-700" aria-label="Nome azienda">
                      {user.user_type === 'client'
                        ? ((user.profile as { company_name?: string })?.company_name || 'Azienda')
                        : user.user_type === 'provider'
                        ? ((user.profile as { business_name?: string })?.business_name || 'Attività')
                        : 'Utente'}
                    </span>
                  </Menu.Button>

                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            to="/dashboard"
                            className={`${
                              active ? 'bg-gray-50' : ''
                            } block px-4 py-2 text-sm text-gray-700`}
                          >
                            Dashboard
                          </Link>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            to="/profile"
                            className={`${
                              active ? 'bg-gray-50' : ''
                            } block px-4 py-2 text-sm text-gray-700`}
                          >
                            Profilo
                          </Link>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            to="/bookings"
                            className={`${
                              active ? 'bg-gray-50' : ''
                            } block px-4 py-2 text-sm text-gray-700`}
                          >
                            Prenotazioni
                          </Link>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={handleSignOut}
                            className={`${
                              active ? 'bg-gray-50' : ''
                            } block w-full text-left px-4 py-2 text-sm text-gray-700`}
                          >
                            Esci
                          </button>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/auth/login"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium"
                >
                  Accedi
                </Link>
                <Link
                  to="/auth/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Registrati
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              onClick={toggleMobileMenu}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={mobileMenuOpen ? 'Chiudi menu' : 'Apri menu'}
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden" id="mobile-menu">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200" role="navigation" aria-label="Menu di navigazione mobile">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="text-gray-700 hover:text-blue-600 block px-3 py-2 text-base font-medium"
                  onClick={toggleMobileMenu}
                >
                  {item.name}
                </Link>
              ))}
              

            </div>
          </div>
        )}
      </div>
    </header>
  );
});

export default Header;