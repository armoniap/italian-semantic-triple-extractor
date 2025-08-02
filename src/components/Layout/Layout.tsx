import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Search, 
  History, 
  Settings, 
  Menu,
  X,
  Globe
} from 'lucide-react';
import { useApplication } from '@/store/ApplicationStore';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { sidebarOpen, toggleSidebar, isApiKeyValid } = useApplication();
  const location = useLocation();

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Analizza', href: '/analyze', icon: Search },
    { name: 'Cronologia', href: '/history', icon: History },
    { name: 'Impostazioni', href: '/settings', icon: Settings },
  ];

  const isActive = (href: string) => {
    return location.pathname === href;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
      
      {/* Sidebar */}
      <div className={`${
        sidebarOpen ? 'w-64' : 'w-0'
      } fixed lg:relative lg:translate-x-0 h-full z-50 lg:z-auto transition-all duration-300 overflow-hidden bg-white shadow-lg ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-2">
              <Globe className="w-8 h-8 text-italian-green" />
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  Triple Extractor
                </h1>
                <p className="text-xs text-gray-500">Italiano</p>
              </div>
            </div>
            <button
              onClick={toggleSidebar}
              className="p-1 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive(item.href)
                          ? 'bg-italian-green text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Status indicator */}
          <div className="p-4 border-t">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                isApiKeyValid ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className="text-sm text-gray-600">
                {isApiKeyValid ? 'API Connessa' : 'API Non Configurata'}
              </span>
            </div>
          </div>

          {/* Italian flag accent with responsive design */}
          <div className="h-2 lg:h-1 italian-accent" />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar with responsive design */}
        <header className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between px-4 lg:px-6 py-4">
            <div className="flex items-center space-x-2 lg:space-x-4 min-w-0 flex-1">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
                aria-label="Toggle menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              {!sidebarOpen && (
                <button
                  onClick={toggleSidebar}
                  className="hidden lg:block p-2 rounded-lg hover:bg-gray-100"
                  aria-label="Open sidebar"
                >
                  <Menu className="w-5 h-5" />
                </button>
              )}
              
              <h2 className="text-lg lg:text-xl font-semibold text-gray-900 truncate">
                <span className="hidden sm:inline">
                  {navigation.find(item => isActive(item.href))?.name || 'Italian Semantic Triple Extractor'}
                </span>
                <span className="sm:hidden">
                  {navigation.find(item => isActive(item.href))?.name || 'Triple Extractor'}
                </span>
              </h2>
            </div>

            {/* Quick status - responsive */}
            <div className="flex items-center space-x-2 lg:space-x-4">
              {!isApiKeyValid && (
                <Link
                  to="/settings"
                  className="text-xs lg:text-sm text-red-600 hover:text-red-700 font-medium px-2 py-1 rounded bg-red-50 hover:bg-red-100 transition-colors"
                >
                  <span className="hidden sm:inline">Configura API Key</span>
                  <span className="sm:hidden">API</span>
                </Link>
              )}
              
              {/* Italian flag indicator */}
              <div className="hidden sm:flex items-center space-x-1 text-xs text-gray-500">
                <span className="italian-wave">🇮🇹</span>
                <span className="hidden lg:inline">Italiano</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content with responsive padding */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 lg:px-6 py-4 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;