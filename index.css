import React from 'react';
import { Link, BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Teams from './components/Teams';
import Schedule from './components/Schedule';
import Standings from './components/Standings';
import Videos from './components/Videos';
import Reglamento from './components/Reglamento';
import Juegos from './components/Juegos';
import TeamDetail from './components/TeamDetail';
import RaceDetail from './components/RaceDetail';
import DriverProfile from './components/DriverProfile';
import Statistics from './components/Statistics';
import { motion, AnimatePresence } from 'motion/react';

const Footer = () => (
  <footer className="bg-white border-t border-f1-black/10 py-16 mt-24 transition-colors duration-300">
    <div className="max-w-7xl mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-2">
          <div className="bg-f1-red px-4 py-2 rounded-sm skew-x-[-12deg] inline-block mb-6">
            <span className="text-white font-display font-black text-2xl italic tracking-tighter">PENTEKARTS</span>
          </div>
          <p className="text-f1-black/40 max-w-sm mb-8 font-medium">
            El campeonato oficial de karting inspirado en la máxima categoría del automovilismo. 
            Pasión, velocidad y competición en estado puro.
          </p>
          <div className="flex gap-4">
            {['Twitter', 'Instagram', 'YouTube', 'Facebook'].map(social => (
              <a key={social} href="#" className="w-10 h-10 rounded-full bg-f1-black/5 flex items-center justify-center hover:bg-f1-red transition-colors group">
                <span className="sr-only">{social}</span>
                <div className="w-4 h-4 bg-f1-black/20 rounded-sm group-hover:bg-white transition-colors" />
              </a>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="text-xs font-black uppercase tracking-widest mb-6 text-f1-black/60">CAMPEONATO</h4>
          <ul className="space-y-4 text-sm font-bold uppercase tracking-wider">
            <li><Link to="/equipos" className="hover:text-f1-red transition-colors text-f1-black">Equipos</Link></li>
            <li><Link to="/equipos" className="hover:text-f1-red transition-colors text-f1-black">Pilotos</Link></li>
            <li><Link to="/calendario" className="hover:text-f1-red transition-colors text-f1-black">Calendario</Link></li>
            <li><Link to="/clasificacion" className="hover:text-f1-red transition-colors text-f1-black">Resultados</Link></li>
          </ul>
        </div>
        
        <div>
          <h4 className="text-xs font-black uppercase tracking-widest mb-6 text-f1-black/60">INFORMACIÓN</h4>
          <ul className="space-y-4 text-sm font-bold uppercase tracking-wider">
            <li><Link to="/reglamento" className="hover:text-f1-red transition-colors text-f1-black">Reglamento</Link></li>
            <li><Link to="/calendario" className="hover:text-f1-red transition-colors text-f1-black">Circuitos</Link></li>
            <li><Link to="#" className="hover:text-f1-red transition-colors text-f1-black">Contacto</Link></li>
            <li><Link to="#" className="hover:text-f1-red transition-colors text-f1-black">Privacidad</Link></li>
          </ul>
        </div>
      </div>
      
      <div className="mt-16 pt-8 border-t border-f1-black/5 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-f1-black/20">
          © 2026 PENTEKARTS CHAMPIONSHIP. TODOS LOS DERECHOS RESERVADOS.
        </p>
        <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-f1-black/20">
          <a href="#" className="hover:text-f1-black transition-colors">POLÍTICA DE COOKIES</a>
          <a href="#" className="hover:text-f1-black transition-colors">AVISO LEGAL</a>
        </div>
      </div>
    </div>
  </footer>
);

const HomePage = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <Hero />
    <div className="bg-white transition-colors duration-300">
      <Standings />
      <div className="bg-f1-black/5 py-16">
        <Teams />
      </div>
      <Schedule />
    </div>
  </motion.div>
);

export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col transition-colors duration-300">
        <Navbar />
        <main className="flex-grow">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/equipos" element={<Teams />} />
              <Route path="/calendario" element={<Schedule />} />
              <Route path="/clasificacion" element={<Standings />} />
              <Route path="/reglamento" element={<Reglamento />} />
              <Route path="/videos" element={<Videos />} />
              <Route path="/equipo/:id" element={<TeamDetail />} />
              <Route path="/carrera/:id" element={<RaceDetail />} />
              <Route path="/piloto/:id" element={<DriverProfile />} />
              <Route path="/estadisticas" element={<Statistics />} />
              <Route path="/juegos" element={<Juegos />} />
            </Routes>
          </AnimatePresence>
        </main>
        <Footer />
      </div>
    </Router>
  );
}
