import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Trophy, Calendar, Users, Home, Info, Play, Gamepad2, Settings, Menu, X, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const Navbar = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const navItems = [
    { name: 'Inicio', path: '/', icon: Home },
    { name: 'Equipos y Pilotos', path: '/equipos', icon: Users },
    { name: 'Calendario', path: '/calendario', icon: Calendar },
    { name: 'Clasificación', path: '/clasificacion', icon: Trophy },
    { name: 'Estadísticas', path: '/estadisticas', icon: Award },
    { name: 'Reglamento', path: '/reglamento', icon: Info },
    { name: 'Videos', path: '/videos', icon: Play },
    { name: 'Juegos', path: '/juegos', icon: Gamepad2 },
  ];

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <nav className="sticky top-0 z-50 bg-f1-red shadow-md">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
            <div className="px-4 py-1">
              <img 
                src="https://pentekarts.web.app/logo_kart_w.png" 
                alt="Pentekarts Logo" 
                className="h-8 w-auto"
                referrerPolicy="no-referrer"
              />
            </div>
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                    isActive ? 'text-white border-b-2 border-white' : 'text-white/70 hover:text-white'
                  }`}
                >
                  <Icon size={14} />
                  {item.name}
                </Link>
              );
            })}
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleMenu}
              className="p-2 text-white hover:text-white transition-colors"
              aria-label="Toggle Menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-f1-red border-t border-white/10 overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`px-4 py-3 text-xs font-black uppercase tracking-widest transition-all flex items-center gap-3 rounded-sm ${
                      isActive ? 'bg-white text-f1-red' : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon size={16} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
