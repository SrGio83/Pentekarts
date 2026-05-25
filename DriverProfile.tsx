import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Driver, Team, Season, fetchDrivers, fetchTeams, fetchSeasons } from '../types';
import { Trophy, ChevronRight } from 'lucide-react';

const Standings = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>('2026');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSeasons().then(data => {
      setSeasons(data);
      if (data.length > 0 && !data.find(s => s.year === selectedSeason)) {
        setSelectedSeason(data[data.length - 1].year);
      }
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchDrivers(selectedSeason),
      fetchTeams(selectedSeason)
    ]).then(([driversData, teamsData]) => {
      setDrivers(driversData);
      setTeams(teamsData);
      setLoading(false);
    });
  }, [selectedSeason]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <h2 className="text-3xl md:text-6xl font-f1-wide italic leading-none mb-4 uppercase">
            CLASIFICACIÓN <br /><span className="text-f1-red">PILOTOS</span>
          </h2>
          <p className="text-f1-black/60 font-medium max-w-md text-sm md:text-base">
            La lucha por el título mundial de karting está más viva que nunca.
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
        <div className="py-24 text-center text-f1-black/40 font-bold uppercase tracking-widest">Cargando clasificación...</div>
      ) : drivers.length === 0 ? (
        <div className="py-24 text-center text-f1-black/40 font-bold uppercase tracking-widest border border-dashed border-f1-black/10 rounded-sm">
          No hay datos disponibles para la temporada {selectedSeason}
        </div>
      ) : (
        <div className="space-y-24">
          {/* Driver Standings */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-f1-black/10 text-[8px] md:text-[10px] font-black uppercase tracking-widest text-f1-black/40">
                  <th className="py-3 md:py-4 px-3 md:px-6">POS</th>
                  <th className="py-3 md:py-4 px-3 md:px-6">PILOTO</th>
                  <th className="py-3 md:py-4 px-3 md:px-6 hidden md:table-cell">EQUIPO</th>
                  <th className="py-3 md:py-4 px-3 md:px-6 text-right">PUNTOS</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((driver, index) => {
                  const team = driver.team;
                  return (
                    <motion.tr
                      key={`${driver.id}-${driver.seasonId}`}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      viewport={{ once: true }}
                      className="group hover:bg-f1-black/5 transition-colors border-b border-f1-black/5"
                    >
                      <td className="py-4 md:py-6 px-3 md:px-6">
                        <div className="flex items-center gap-2 md:gap-4">
                          <span className={`text-xl md:text-2xl font-f1-bold font-black italic ${index < 3 ? 'text-f1-red' : 'text-f1-black/30'}`}>
                            {index + 1}
                          </span>
                          {index === 0 && <Trophy size={14} className="text-yellow-600 md:w-[16px] md:h-[16px]" />}
                        </div>
                      </td>
                      <td className="py-4 md:py-6 px-3 md:px-6">
                        <div className="flex items-center gap-2 md:gap-4">
                          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden border border-f1-black/10 bg-f1-black/5 hidden sm:block">
                            <img src={driver.image || 'https://via.placeholder.com/150'} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                          <div className="flex items-center gap-2 md:gap-3">
                            <div className="w-1 h-6 md:h-8 rounded-full" style={{ backgroundColor: team?.color }} />
                            <div className="flex flex-col">
                              <Link 
                                to={`/piloto/${driver.id}`}
                                className="text-base md:text-lg font-f1-bold font-bold italic tracking-tight hover:text-f1-red transition-colors text-f1-black leading-tight"
                              >
                                {driver.name}
                              </Link>
                              <span className="text-[9px] font-bold text-f1-black/40 md:hidden uppercase tracking-tighter">
                                {team?.name || '--'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 md:py-6 px-3 md:px-6 hidden md:table-cell">
                        {team ? (
                          <Link to={`/equipo/${team.id}`} className="text-xs font-bold tracking-widest text-f1-black/60 hover:text-f1-red transition-colors">
                            {team.name}
                          </Link>
                        ) : (
                          <span className="text-xs font-bold uppercase tracking-widest text-f1-black/60">--</span>
                        )}
                      </td>
                      <td className="py-4 md:py-6 px-3 md:px-6 text-right">
                        <span className="text-xl md:text-2xl font-f1-bold font-black italic text-f1-black">{driver.points}</span>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Team Standings */}
          <div>
            <div className="mb-12">
              <h2 className="text-3xl md:text-6xl font-f1-wide italic leading-none mb-4 uppercase text-f1-black">
                CLASIFICACIÓN <br /><span className="text-f1-red">EQUIPOS</span>
              </h2>
              <p className="text-f1-black/60 font-medium max-w-md text-sm md:text-base">
                El campeonato de constructores premia la consistencia y el trabajo en equipo.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-f1-black/10 text-[8px] md:text-[10px] font-black uppercase tracking-widest text-f1-black/40">
                    <th className="py-3 md:py-4 px-3 md:px-6">POS</th>
                    <th className="py-3 md:py-4 px-3 md:px-6">EQUIPO</th>
                    <th className="py-3 md:py-4 px-3 md:px-6 text-right">PUNTOS</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((team, index) => (
                    <motion.tr
                      key={`${team.id}-${team.seasonId}`}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      viewport={{ once: true }}
                      className="group hover:bg-f1-black/5 transition-colors border-b border-f1-black/5"
                    >
                      <td className="py-4 md:py-6 px-3 md:px-6">
                        <div className="flex items-center gap-2 md:gap-4">
                          <span className={`text-xl md:text-2xl font-f1-bold font-black italic ${index < 3 ? 'text-f1-red' : 'text-f1-black/30'}`}>
                            {index + 1}
                          </span>
                          {index === 0 && <Trophy size={14} className="text-yellow-600 md:w-[16px] md:h-[16px]" />}
                        </div>
                      </td>
                      <td className="py-4 md:py-6 px-3 md:px-6">
                        <div className="flex items-center gap-2 md:gap-4">
                          <div className="w-8 h-8 md:w-12 md:h-12 bg-white rounded-sm border border-f1-black/5 p-1 md:p-2 flex items-center justify-center hidden sm:flex">
                            <img src={team.logo || 'https://via.placeholder.com/150'} alt="" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                          </div>
                          <div className="flex items-center gap-2 md:gap-3">
                            <div className="w-1 h-6 md:h-8 rounded-full" style={{ backgroundColor: team.color }} />
                            <Link 
                              to={`/equipo/${team.id}`}
                              className="text-base md:text-lg font-f1-bold font-bold italic tracking-tight hover:text-f1-red transition-colors text-f1-black"
                            >
                              {team.name}
                            </Link>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 md:py-6 px-3 md:px-6 text-right">
                        <span className="text-xl md:text-2xl font-f1-bold font-black italic text-f1-black">{team.points}</span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="mt-12 flex justify-center">
        <button className="bg-f1-red text-white px-10 py-4 font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-red-700 transition-all">
          VER CLASIFICACIÓN COMPLETA
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default Standings;
