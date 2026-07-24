import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { Sun, Moon, Menu, User } from 'lucide-react';
import { toggleTheme } from '../../store/slices/themeSlice';

const routeLabels = {
  '/': ['Dashboard'],
  '/products': ['Products', 'Product List'],
  '/products/add': ['Products', 'Add New'],
  '/products/categories': ['Products', 'Categories'],
  '/products/colors': ['Products', 'Colors'],
  '/products/brands': ['Products', 'Brands'],
};

export default function Header({ onMenuToggle }) {
  const dispatch = useDispatch();
  const { darkMode } = useSelector((state) => state.theme);
  const location = useLocation();

  const breadcrumbs = routeLabels[location.pathname] || ['Dashboard'];

  return (
    <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-4 sm:px-6 bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark">
      {/* Left: hamburger + breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          id="menu-toggle"
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg hover:bg-background-light dark:hover:bg-background-dark text-text-secondary-light dark:text-text-secondary-dark transition-colors"
        >
          <Menu size={20} />
        </button>

        <nav className="flex items-center gap-1.5 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <span key={index} className="flex items-center gap-1.5">
              {index > 0 && (
                <span className="text-text-secondary-light dark:text-text-secondary-dark">/</span>
              )}
              <span
                className={
                  index === breadcrumbs.length - 1
                    ? 'font-medium text-text-primary-light dark:text-text-primary-dark'
                    : 'text-text-secondary-light dark:text-text-secondary-dark'
                }
              >
                {crumb}
              </span>
            </span>
          ))}
        </nav>
      </div>

      {/* Right: dark mode + avatar */}
      <div className="flex items-center gap-3">
        <button
          id="dark-mode-toggle"
          onClick={() => dispatch(toggleTheme())}
          className="p-2 rounded-lg hover:bg-background-light dark:hover:bg-background-dark text-text-secondary-light dark:text-text-secondary-dark transition-colors"
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="flex items-center gap-2.5 pl-3 border-l border-border-light dark:border-border-dark">
          <div className="w-8 h-8 rounded-full bg-accent-brand/10 flex items-center justify-center">
            <User size={16} className="text-accent-brand" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark leading-none">
              Admin User
            </p>
            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
              admin@crmpro.com
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
