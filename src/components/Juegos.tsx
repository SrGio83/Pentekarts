import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Gamepad2, Trophy, Users, Zap } from 'lucide-react';
import { fetchGames, Game } from '../types';

const Juegos = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGames().then(data => {
      setGames(data);
      setLoading(false);
    });
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 py-24"
    >
      <div className="mb-16">
        <h1 className="text-5xl italic font-black tracking-tighter mb-6">
          ZONA DE <span className="text-f1-red">JUEGOS</span>
        </h1>
        <p className="text-f1-black/60 max-w-3xl text-lg font-medium">
          Entrena tus habilidades fuera de la pista con nuestra selección de simuladores y juegos oficiales de Pentekarts.
        </p>
      </div>

      {loading ? (
        <div className="py-24 text-center text-f1-black/40 font-bold uppercase tracking-widest">Cargando juegos...</div>
      ) : games.length === 0 ? (
        <div className="py-24 text-center text-f1-black/40 font-bold uppercase tracking-widest border border-dashed border-f1-black/10 rounded-sm">
          No hay juegos disponibles en este momento.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {games.map((game, idx) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="group bg-white border border-f1-black/5 overflow-hidden hover:border-f1-red transition-all"
            >
              <div className="relative aspect-video overflow-hidden">
                <img 
                  src={game.image} 
                  alt={game.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-f1-red text-white text-[10px] font-black px-3 py-1 uppercase tracking-widest">
                    {game.category}
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-black italic tracking-tight mb-3 group-hover:text-f1-red transition-colors">
                  {game.title}
                </h3>
                <p className="text-f1-black/60 text-sm mb-6 line-clamp-2">
                  {game.description}
                </p>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-f1-black/40">
                    <Users size={12} />
                    {game.players}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-f1-black/40">
                    <Zap size={12} />
                    Dificultad: {game.difficulty}
                  </div>
                </div>
                
                <a 
                  href={game.game_url || '#'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block w-full py-3 border-2 border-f1-black text-f1-black text-center text-[10px] font-black uppercase tracking-widest hover:bg-f1-black hover:text-white transition-all"
                >
                  {game.button_text || 'JUGAR AHORA'}
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="mt-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="order-2 lg:order-1">
          <h2 className="text-3xl font-black italic tracking-tighter mb-6">
            SISTEMA DE <span className="text-f1-red">RANKING MUNDIAL</span>
          </h2>
          <p className="text-f1-black/60 mb-8 font-medium">
            Tus tiempos en los simuladores cuentan para el ranking global de Pentekarts. Los mejores pilotos virtuales reciben invitaciones exclusivas para eventos presenciales y pruebas de conducción reales.
          </p>
          <div className="space-y-4">
            {[
              { icon: Trophy, text: 'Premios mensuales para el Top 3' },
              { icon: Gamepad2, text: 'Torneos semanales online' },
              { icon: Zap, text: 'Desbloquea karts exclusivos' }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 text-f1-black font-bold uppercase tracking-wider text-sm">
                <div className="text-f1-red"><item.icon size={18} /></div>
                {item.text}
              </div>
            ))}
          </div>
        </div>
        <div className="order-1 lg:order-2 bg-f1-black p-4 rounded-sm rotate-2">
          <img 
            src="https://picsum.photos/seed/setup/800/600" 
            alt="Gaming Setup" 
            className="w-full h-auto rounded-sm -rotate-2"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </motion.div>
  );
};

export default Juegos;
