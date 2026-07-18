import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Team, Driver, Season, fetchTeams, fetchDrivers, fetchSeasons } from '../types';
import { ChevronRight, RefreshCw, Users as UsersIcon } from 'lucide-react';

const Teams = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>('2026');
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    console.log('Teams component: Fetching data for season', selectedSeason);
    Promise.all([
      fetchTeams(selectedSeason),
      fetchDrivers(selectedSeason)
    ]).then(([teamsData, driversData]) => {
      console.log('Teams component: Received teams', teamsData.length);
      console.log('Teams component: Received drivers', driversData.length);
      setTeams(teamsData);
      setDrivers(driversData);
      setLoading(false);
    }).catch(err => {
      console.error('Teams component: Error fetching data', err);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchSeasons().then(data => {
      setSeasons(data);
      if (data.length > 0 && !data.find(s => s.year === selectedSeason)) {
        setSelectedSeason(data[data.length - 1].year);
      }
    });
  }, []);

  useEffect(() => {
    loadData();
  }, [selectedSeason]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <h2 className="text-4xl md:text-6xl italic leading-none mb-4 uppercase text-f1-black">
            EQUIPOS <br /><span className="text-f1-red">{selectedSeason}</span>
          </h2>
          <p className="text-f1-black/60 font-medium max-w-md">
            Conoce a las escuderías que compiten por la gloria en el campeonato Pentekarts.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {seasons.map(season => (
            <button
              key={season.id}
              onClick={() => setSelectedSeason(season.year)}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-sm transition-all ${
                selectedSeason === season.year 
                  ? 'bg-f1-red text-white' 
                  : 'bg-f1-black/5 text-f1-black/40 hover:bg-f1-black/10'
              }`}
            >
              TEMPORADA {season.year}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center text-f1-black/40 font-bold uppercase tracking-widest">Cargando equipos...</div>
      ) : teams.length === 0 ? (
        <div className="py-24 text-center border-2 border-dashed border-f1-black/10 rounded-sm bg-f1-black/5">
          <div className="max-w-md mx-auto px-6">
            <div className="w-16 h-16 bg-f1-black/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <UsersIcon size={32} className="text-f1-black/20" />
            </div>
            <h3 className="text-2xl font-display font-black italic mb-2 text-f1-black">
              Sin escuderías registradas
            </h3>
            <p className="text-f1-black/60 text-sm mb-8">
              Parece que aún no se han dado de alta los equipos para la temporada {selectedSeason}. 
              Si crees que esto es un error, intenta recargar los datos o contacta con el administrador.
            </p>
            <button 
              onClick={loadData}
              className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest bg-f1-black text-white px-8 py-3 rounded-sm hover:bg-f1-red transition-all transform hover:scale-105 active:scale-95 shadow-lg"
            >
              <RefreshCw size={16} />
              REINTENTAR CARGA
            </button>
            <p className="mt-8 text-[10px] text-f1-black/30 uppercase font-bold tracking-widest">
              Estado: Conexión establecida con Supabase
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {teams.map((team, index) => (
          <motion.div
            key={`${team.id}-${team.seasonId}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            viewport={{ once: true }}
            className="f1-card group relative overflow-hidden"
            style={{ backgroundColor: team.color ? `${team.color}15` : undefined }}
          >
            {/* Team Color Accent */}
            <div 
              className="absolute top-0 left-0 w-full h-1" 
              style={{ backgroundColor: team.color }}
            />
            
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-sm border border-f1-black/5 p-2 flex items-center justify-center">
                    <img src={team.logo || 'https://via.placeholder.com/150'} alt="" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <span className="text-xs font-black opacity-40 absolute -top-2 -left-2 select-none text-f1-black">#{team.rank}</span>
                    <h3 className="text-xl font-display font-bold italic group-hover:text-f1-red transition-colors text-f1-black leading-tight">{team.name}</h3>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] font-black opacity-40 uppercase tracking-widest text-f1-black">PUNTOS</span>
                  <span className="text-2xl font-display font-black italic text-f1-black">{team.points}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="h-px bg-f1-black/10" />
                <div>
                  <span className="block text-[10px] font-black opacity-40 uppercase tracking-widest mb-2 text-f1-black">PILOTOS</span>
                  <div className="flex flex-wrap gap-2">
                        {drivers.filter(d => d.teamId === team.id).map((driver, idx) => (
                          <Link 
                            key={`${driver.id}-${idx}`} 
                            to={`/piloto/${driver.id}`}
                            className="bg-f1-black/5 px-3 py-1 rounded-sm text-xs font-bold tracking-wider border border-f1-black/5 text-f1-black hover:bg-f1-red hover:text-white transition-colors"
                          >
                            {driver.name}
                          </Link>
                        ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <Link to={`/equipo/${team.id}`} className="text-xs font-black uppercase tracking-widest flex items-center gap-2 group-hover:text-f1-red transition-colors text-f1-black">
                  VER DETALLES
                  <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Background Pattern */}
            <div className="absolute -bottom-4 -right-4 opacity-5 pointer-events-none text-f1-black">
               <svg width="120" height="120" viewBox="0 0 100 100" fill="currentColor">
                 <path d="M0 0 L100 0 L100 100 Z" />
               </svg>
            </div>
          </motion.div>
        ))}
      </div>
      )}
    </div>
  );
};

export default Teams;
