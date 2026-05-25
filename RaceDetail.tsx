import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Team, Driver, fetchTeams, fetchDrivers } from '../types';
import { supabase } from '../supabaseClient';
import { ChevronLeft, Trophy, Users, ExternalLink } from 'lucide-react';

const TeamDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [team, setTeam] = useState<Team | null>(null);
  const [teamDrivers, setTeamDrivers] = useState<Driver[]>([]);
  const [stats, setStats] = useState({ wins: 0, podiums: 0, poles: 0, totalPoints: 0 });
  const [seasonalStats, setSeasonalStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const numericId = Number(id);
      const [teams, drivers] = await Promise.all([fetchTeams(), fetchDrivers()]);
      
      const foundTeam = teams.find(t => t.id === numericId);
      if (foundTeam) {
        setTeam(foundTeam);
        
        // Get all historical entries for this team from season_drivers
        const { data: teamHistory, error: historyError } = await supabase
          .from('season_drivers')
          .select(`
            driver_id,
            season_id,
            points,
            seasons (year)
          `)
          .eq('team_id', numericId);

        if (!historyError && teamHistory) {
          const driverIds = Array.from(new Set(teamHistory.map(h => h.driver_id)));
          
          // Fetch all race results for these drivers
          const { data: results, error: resultsError } = await supabase
            .from('race_results')
            .select(`
              position, 
              grid_position, 
              points_earned, 
              driver_id,
              race_id,
              race_sessions!inner(
                name
              ),
              races (
                race_date
              )
            `)
            .in('driver_id', driverIds);

          if (!resultsError && results) {
            // We need to filter results to only those where the driver was in THIS team during THAT season
            const validResults = results.filter(r => {
              const raceData = Array.isArray(r.races) ? r.races[0] : r.races;
              const raceYear = raceData?.race_date ? new Date(raceData.race_date).getFullYear().toString() : null;
              return teamHistory.some(h => h.driver_id === r.driver_id && (h.seasons as any)?.year === raceYear);
            });

            const carreraResults = validResults.filter(r => (r.race_sessions as any).name?.startsWith('Carrera'));
            
            // Total Stats
            const totalWins = carreraResults.filter(r => r.position === 1).length;
            const totalPodiums = carreraResults.filter(r => r.position >= 1 && r.position <= 3).length;
            const totalPoles = validResults.filter(r => (r.race_sessions as any).name === 'Clasificación' && r.position === 1).length;
            const totalPoints = teamHistory.reduce((acc, h) => acc + (h.points || 0), 0);

            setStats({ wins: totalWins, podiums: totalPodiums, poles: totalPoles, totalPoints });

            // Seasonal Stats
            const seasonsMap = new Map();
            teamHistory.forEach(h => {
              const year = (h.seasons as any)?.year;
              if (!seasonsMap.has(year)) {
                seasonsMap.set(year, { year, wins: 0, podiums: 0, poles: 0, points: 0 });
              }
              seasonsMap.get(year).points += (h.points || 0);
            });

            validResults.forEach(r => {
              const raceData = Array.isArray(r.races) ? r.races[0] : r.races;
              const year = raceData?.race_date ? new Date(raceData.race_date).getFullYear().toString() : null;
              if (year && seasonsMap.has(year)) {
                const s = seasonsMap.get(year);
                if ((r.race_sessions as any).name?.startsWith('Carrera')) {
                  if (r.position === 1) s.wins++;
                  if (r.position >= 1 && r.position <= 3) s.podiums++;
                }
                if ((r.race_sessions as any).name === 'Clasificación' && r.position === 1) s.poles++;
              }
            });

            setSeasonalStats(Array.from(seasonsMap.values()).sort((a, b) => b.year.localeCompare(a.year)));
          }
        }

        // Current Drivers (for the bottom list)
        const driversOfTeam = drivers.filter(d => d.teamId === numericId);
        const mostRecentYear = Math.max(...driversOfTeam.map(d => Number(d.seasonYear || 0)));
        const currentDrivers = driversOfTeam.filter(d => Number(d.seasonYear) === mostRecentYear);
        setTeamDrivers(currentDrivers);
      }
      setLoading(false);
    };
    loadData();
  }, [id]);

  if (loading) return <div className="py-24 text-center">Cargando equipo...</div>;
  if (!team) return <div className="py-24 text-center">Equipo no encontrado</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-24">
      <Link 
        to="/equipos" 
        className="inline-flex items-center gap-2 text-f1-black/60 hover:text-f1-red transition-colors mb-12 font-bold uppercase text-xs tracking-widest"
      >
        <ChevronLeft size={16} /> VOLVER A EQUIPOS
      </Link>

      {/* Team Identity Card - Full Width */}
      <div className="mb-8">
        <div className="bg-white p-8 md:p-12 rounded-sm border-2 border-f1-black/5 shadow-xl relative overflow-hidden flex flex-col justify-center">
          <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: team.color }} />
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="w-40 h-40 md:w-56 md:h-56 shrink-0 flex items-center justify-center bg-white p-4">
              <img src={team.logo || 'https://via.placeholder.com/150'} alt={team.name} className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
            </div>
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                <span className="text-sm font-black uppercase tracking-[0.3em] text-f1-black/30">TEMPORADA {team.seasonYear}</span>
              </div>
              <h1 className="text-3xl md:text-6xl italic font-black tracking-tighter leading-tight mb-4 break-words">{team.name}</h1>
              <div className="flex items-center justify-center md:justify-start gap-3">
                <div className="w-12 h-1.5" style={{ backgroundColor: team.color }} />
                <span className="text-xs font-bold uppercase tracking-widest text-f1-black/60">VALENCIA, ESPAÑA</span>
              </div>
            </div>
          </div>
          
          {/* Rank Badge */}
          <div className="absolute -top-6 -right-6 w-20 h-20 md:w-24 md:h-24 bg-f1-black text-white flex items-end justify-start p-4 md:p-6 rotate-45">
            <span className="text-2xl md:text-3xl font-black italic -rotate-45 translate-x-1 translate-y-1">#{team.rank}</span>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid - Reduced Size */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        {/* Points Card */}
        <div className="bg-f1-red text-white p-8 rounded-sm shadow-lg flex flex-col justify-center items-center text-center skew-x-[-4deg]">
          <span className="text-[8px] font-black uppercase tracking-[0.4em] opacity-70 mb-2">PUNTOS TOTALES</span>
          <span className="text-6xl md:text-7xl font-black italic leading-none">{stats.totalPoints}</span>
          <div className="mt-4 h-1 w-16 bg-white/30" />
        </div>

        {/* Drivers Count Card */}
        <div className="bg-f1-black text-white p-8 rounded-sm shadow-lg flex flex-col justify-center items-center text-center skew-x-[-4deg]">
          <span className="text-[8px] font-black uppercase tracking-[0.4em] opacity-70 mb-2">PILOTOS ACTUALES</span>
          <span className="text-6xl md:text-7xl font-black italic leading-none">{teamDrivers.length}</span>
          <div className="mt-4 h-1 w-16 bg-white/30" />
        </div>
      </div>

      {/* Seasonal Statistics Breakdown */}
      <div className="space-y-8 mb-24">
        <div className="bg-f1-black/5 p-8 rounded-sm border-t-4" style={{ borderColor: team.color }}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <h2 className="text-xl italic font-black uppercase">ESTADÍSTICAS HISTÓRICAS</h2>
            <div className="flex gap-6">
              <div className="text-center">
                <span className="block text-[8px] font-black opacity-40 uppercase tracking-widest">TOTAL VICTORIAS</span>
                <span className="text-2xl font-display font-black italic text-f1-red">{stats.wins}</span>
              </div>
              <div className="text-center">
                <span className="block text-[8px] font-black opacity-40 uppercase tracking-widest">TOTAL PODIOS</span>
                <span className="text-2xl font-display font-black italic">{stats.podiums}</span>
              </div>
              <div className="text-center">
                <span className="block text-[8px] font-black opacity-40 uppercase tracking-widest">TOTAL POLES</span>
                <span className="text-2xl font-display font-black italic">{stats.poles}</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black uppercase tracking-widest opacity-40 border-b border-f1-black/10">
                  <th className="pb-4">TEMPORADA</th>
                  <th className="pb-4">VICTORIAS</th>
                  <th className="pb-4">PODIOS</th>
                  <th className="pb-4">POLES</th>
                  <th className="pb-4 text-right">PUNTOS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-f1-black/5">
                {seasonalStats.map((s, idx) => (
                  <tr key={idx} className="group hover:bg-f1-black/5 transition-colors">
                    <td className="py-4 font-display font-black italic text-lg">{s.year}</td>
                    <td className="py-4 font-bold">{s.wins}</td>
                    <td className="py-4 font-bold">{s.podiums}</td>
                    <td className="py-4 font-bold">{s.poles}</td>
                    <td className="py-4 text-right font-display font-black italic text-lg text-f1-red">{s.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <h2 className="text-3xl italic font-black mb-12 uppercase border-b-4 border-f1-red inline-block">PILOTOS <span className="text-f1-red">OFICIALES</span></h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {teamDrivers.map((driver, index) => (
          <motion.div
            key={driver.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link 
              to={`/piloto/${driver.id}`}
              className="group block relative bg-white border border-f1-black/10 rounded-sm overflow-hidden hover:shadow-xl transition-all"
            >
              <div className="flex items-center p-6 gap-6 md:gap-8">
                <div className="w-28 h-28 md:w-36 md:h-36 shrink-0 relative">
                  <div className="absolute inset-0 bg-f1-black/5 rounded-sm skew-x-[-6deg]" />
                  <img 
                    src={driver.image || 'https://via.placeholder.com/400x400'} 
                    alt={driver.name}
                    className="absolute inset-0 w-full h-full object-cover rounded-sm skew-x-[-6deg] border-2 border-white shadow-md relative z-10 group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-grow">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl md:text-3xl font-display font-black italic text-f1-black/10">#{driver.rank}</span>
                    <div className="h-1 w-8 md:w-12" style={{ backgroundColor: team.color }} />
                  </div>
                  <h3 className="text-xl md:text-2xl font-display font-black italic leading-tight mb-4">
                    {driver.name.split(' ')[0]} <span className="text-f1-red">{driver.name.split(' ').slice(1).join(' ')}</span>
                  </h3>
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-0.5">PUNTOS</p>
                      <p className="text-2xl md:text-3xl font-display font-black italic text-f1-black">{driver.points}</p>
                    </div>
                    <div className="h-8 w-px bg-f1-black/10" />
                    <div>
                      <p className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-0.5">TEMPORADA</p>
                      <p className="text-sm font-bold italic text-f1-black/60">{driver.seasonYear || '2026'}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Decorative element */}
              <div className="absolute top-0 right-0 w-16 h-16 opacity-[0.03] pointer-events-none">
                <Trophy size={64} className="-rotate-12 translate-x-4 -translate-y-4" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default TeamDetail;
