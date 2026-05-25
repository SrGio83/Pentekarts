import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Driver, fetchDriverById, fetchDriverHistory, fetchDrivers, fetchDriverStats } from '../types';
import { supabase } from '../supabaseClient';
import { Trophy, Award, MapPin, ChevronLeft, Calendar, Users, GitCompare, X, Search, Hash, Timer, FileText, LineChart as ChartIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Dot } from 'recharts';

const DriverProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [raceResults, setRaceResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [driverStats, setDriverStats] = useState({ 
    racesDisputed: 0, 
    lapsLed: 0, 
    wins: 0, 
    podiums: 0,
    poles: 0,
    fastestLaps: 0,
    bestPosition: 0
  });
  
  // Comparison state
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [allDrivers, setAllDrivers] = useState<Driver[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [compareDriver, setCompareDriver] = useState<Driver | null>(null);
  const [compareHistory, setCompareHistory] = useState<any[]>([]);
  const [compareRaceResults, setCompareRaceResults] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      setLoading(true);
      Promise.all([
        fetchDriverById(Number(id)),
        fetchDriverHistory(Number(id)),
        fetchDrivers(),
        fetchDriverStats(Number(id))
      ]).then(([driverData, historyData, driversData, statsData]) => {
        setDriver(driverData);
        setHistory(historyData);
        setAllDrivers(driversData.filter(d => d.id !== Number(id)));
        setDriverStats(statsData);
        
        // Fetch detailed race results for this driver
        fetchDriverRaceResults(Number(id)).then(setRaceResults);
        
        setLoading(false);
      });
    }
  }, [id]);

  const fetchDriverRaceResults = async (driverId: number) => {
    const { data, error } = await supabase
      .from('race_results')
      .select(`
        *,
        races (
          name,
          short_name,
          race_date
        ),
        race_sessions!inner (
          id,
          name,
          session_pdf (
            url_pdf
          )
        )
      `)
      .eq('driver_id', driverId)
      .ilike('race_sessions.name', 'Carrera%');

    if (error) {
      console.error('Error fetching race results:', error);
      return [];
    }

    // Sort by race_date ascending for the chart
    const sortedData = (data || []).sort((a: any, b: any) => {
      const dateA = new Date(a.races?.race_date || 0).getTime();
      const dateB = new Date(b.races?.race_date || 0).getTime();
      return dateA - dateB;
    });

    return sortedData;
  };

  const totalPoints = history.reduce((sum, entry) => sum + (entry.points || 0), 0);

  const handleCompare = async (otherDriver: Driver) => {
    setCompareDriver(otherDriver);
    const [historyData, resultsData] = await Promise.all([
      fetchDriverHistory(otherDriver.id),
      fetchDriverRaceResults(otherDriver.id)
    ]);
    setCompareHistory(historyData);
    setCompareRaceResults(resultsData);
    setShowCompareModal(false);
  };

  const filteredDrivers = allDrivers.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-f1-black/40 font-black uppercase tracking-widest animate-pulse">
          Cargando perfil del piloto...
        </div>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
        <h2 className="text-4xl font-display font-black italic mb-4">PILOTO NO ENCONTRADO</h2>
        <Link to="/clasificacion" className="text-f1-red font-bold uppercase tracking-widest flex items-center gap-2">
          <ChevronLeft size={20} /> VOLVER A LA CLASIFICACIÓN
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-f1-black text-white pt-32 pb-20 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0 0 L100 0 L100 100 Z" fill="currentColor" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex justify-between items-start mb-12">
            <Link to="/clasificacion" className="inline-flex items-center gap-2 text-white/60 hover:text-f1-red transition-colors text-xs font-black uppercase tracking-widest">
              <ChevronLeft size={16} /> VOLVER
            </Link>
            
            <button 
              onClick={() => setShowCompareModal(true)}
              className="bg-f1-red hover:bg-white hover:text-f1-red text-white px-6 py-2 rounded-sm font-black uppercase tracking-widest text-xs transition-all flex items-center gap-2"
            >
              <GitCompare size={16} /> COMPARAR PILOTO
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-12 items-center lg:items-end">
            {/* Driver Image */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              className="w-64 h-64 lg:w-96 lg:h-96 rounded-sm overflow-hidden border-4 border-white/10 bg-white/5 relative group"
            >
              <img 
                src={driver.image || 'https://via.placeholder.com/400'} 
                alt={driver.name} 
                className="w-full h-full object-cover transition-all duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-f1-black to-transparent" />
              <div className="absolute bottom-4 left-4">
                <span className="text-6xl font-display font-black italic opacity-20">#{driver.rank}</span>
              </div>
            </motion.div>

            {/* Driver Info */}
            <div className="flex-grow text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                  <div className="w-2 h-10 rounded-full" style={{ backgroundColor: driver.team?.color }} />
                  <span className="text-xl font-display font-bold italic tracking-widest text-white/60">
                    {driver.team?.name}
                  </span>
                </div>
                <h1 
                  className="text-6xl lg:text-8xl font-f1-wide font-black italic leading-none mb-6 flex flex-col lg:flex-row lg:gap-4 normal-case"
                  style={{ '--team-color': driver.team?.color } as React.CSSProperties}
                >
                  <span className="text-white text-stroke-team">
                    {driver.name.split(' ')[0]}
                  </span>
                  <span className="text-[var(--team-color)] text-stroke-white">
                    {driver.name.split(' ').slice(1).join(' ')}
                  </span>
                </h1>
                
                <div className="flex flex-wrap justify-center lg:justify-start gap-8">
                  <div className="text-center lg:text-left">
                    <span className="block text-[10px] font-black opacity-40 uppercase tracking-widest mb-1">PUNTOS TEMPORADA</span>
                    <span className="text-4xl font-f1-bold italic">{driver.points}</span>
                  </div>
                  <div className="text-center lg:text-left">
                    <span className="block text-[10px] font-black opacity-40 uppercase tracking-widest mb-1">PUNTOS TOTALES</span>
                    <span className="text-4xl font-f1-bold italic text-f1-red">{totalPoints}</span>
                  </div>
                  <div className="text-center lg:text-left">
                    <span className="block text-[10px] font-black opacity-40 uppercase tracking-widest mb-1">POSICIÓN ACTUAL</span>
                    <span className="text-4xl font-f1-bold italic text-f1-red">#{driver.rank}</span>
                  </div>
                  <div className="text-center lg:text-left">
                    <span className="block text-[10px] font-black opacity-40 uppercase tracking-widest mb-1">TEMPORADA</span>
                    <span className="text-4xl font-f1-bold italic">{driver.seasonYear}</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison View */}
      <AnimatePresence>
        {compareDriver && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-f1-red text-white overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-4 py-12">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-display font-black italic uppercase tracking-widest">COMPARATIVA DE RENDIMIENTO</h2>
                <button 
                  onClick={() => setCompareDriver(null)}
                  className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-center">
                <div className="text-center">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/20 mx-auto mb-4">
                    <img src={driver.image} alt={driver.name} className="w-full h-full object-cover" />
                  </div>
                  <h3 className="font-display font-black italic text-xl">{driver.name}</h3>
                  <p className="text-white/60 font-bold tracking-widest text-xs">{driver.team?.name}</p>
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between items-end border-b border-white/10 pb-2">
                    <span className="text-4xl font-f1-bold italic">{driver.points}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">PUNTOS</span>
                    <span className="text-4xl font-f1-bold italic">{compareDriver.points}</span>
                  </div>
                  <div className="flex justify-between items-end border-b border-white/10 pb-2">
                    <span className="text-4xl font-f1-bold italic">#{driver.rank}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">RANKING</span>
                    <span className="text-4xl font-f1-bold italic">#{compareDriver.rank}</span>
                  </div>
                  <div className="flex justify-between items-end border-b border-white/10 pb-2">
                    <span className="text-4xl font-f1-bold italic">{raceResults.filter(r => r.position === 1).length}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">VICTORIAS</span>
                    <span className="text-4xl font-f1-bold italic">{compareRaceResults.filter(r => r.position === 1).length}</span>
                  </div>
                  <div className="flex justify-between items-end border-b border-white/10 pb-2">
                    <span className="text-4xl font-f1-bold italic">{raceResults.filter(r => r.position <= 3).length}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">PODIOS</span>
                    <span className="text-4xl font-f1-bold italic">{compareRaceResults.filter(r => r.position <= 3).length}</span>
                  </div>
                </div>

                <div className="text-center">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/20 mx-auto mb-4">
                    <img src={compareDriver.image} alt={compareDriver.name} className="w-full h-full object-cover" />
                  </div>
                  <h3 className="font-display font-black italic text-xl">{compareDriver.name}</h3>
                  <p className="text-white/60 font-bold tracking-widest text-xs">{compareDriver.team?.name}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column: Stats & Team */}
          <div className="lg:col-span-1 space-y-12">
            <section>
              <h3 className="text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-f1-black/10 pb-2">
                <Users size={14} className="text-f1-red" /> EQUIPO ACTUAL
              </h3>
              {driver.team ? (
                <Link to={`/equipo/${driver.teamId}`} className="group block bg-f1-black/5 p-6 rounded-sm hover:bg-f1-black/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white rounded-sm p-2 flex items-center justify-center border border-f1-black/5">
                      <img src={driver.team.logo || 'https://via.placeholder.com/100'} alt="" className="max-w-full max-h-full object-contain" />
                    </div>
                    <div>
                      <h4 className="text-xl font-display font-bold italic group-hover:text-f1-red transition-colors">{driver.team.name}</h4>
                      <span className="text-[10px] font-black opacity-40 uppercase tracking-widest">VER ESCUDERÍA</span>
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="bg-f1-black/5 p-6 rounded-sm italic text-f1-black/40">Sin equipo asignado</div>
              )}
            </section>

            <section>
              <h3 className="text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-f1-black/10 pb-2">
                <Award size={14} className="text-f1-red" /> LOGROS
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-f1-black/5 p-4 rounded-sm text-center">
                  <Trophy size={24} className="mx-auto mb-2 text-yellow-600" />
                  <span className="block text-[10px] font-black opacity-40 uppercase">VICTORIAS</span>
                  <span className="text-2xl font-display font-black italic">
                    {driverStats.wins || '--'}
                  </span>
                </div>
                <div className="bg-f1-black/5 p-4 rounded-sm text-center">
                  <Award size={24} className="mx-auto mb-2 text-f1-red" />
                  <span className="block text-[10px] font-black opacity-40 uppercase">POLE POSITIONS</span>
                  <span className="text-2xl font-display font-black italic">
                    {driverStats.poles || '--'}
                  </span>
                </div>
                <div className="bg-f1-black/5 p-4 rounded-sm text-center">
                  <Award size={24} className="mx-auto mb-2 text-f1-red" />
                  <span className="block text-[10px] font-black opacity-40 uppercase">PODIOS</span>
                  <span className="text-2xl font-display font-black italic">
                    {driverStats.podiums || '--'}
                  </span>
                </div>
                <div className="bg-f1-black/5 p-4 rounded-sm text-center">
                  <Calendar size={24} className="mx-auto mb-2 text-f1-black/40" />
                  <span className="block text-[10px] font-black opacity-40 uppercase">CARRERAS</span>
                  <span className="text-2xl font-f1-bold italic">
                    {driverStats.racesDisputed || '--'}
                  </span>
                </div>
                <div className="bg-f1-black/5 p-4 rounded-sm text-center">
                  <Timer size={24} className="mx-auto mb-2 text-f1-black/40" />
                  <span className="block text-[10px] font-black opacity-40 uppercase">V. LIDERADAS</span>
                  <span className="text-2xl font-f1-bold italic">
                    {driverStats.lapsLed || '--'}
                  </span>
                </div>
                <div className="bg-f1-black/5 p-4 rounded-sm text-center">
                  <Timer size={24} className="mx-auto mb-2 text-f1-red" />
                  <span className="block text-[10px] font-black opacity-40 uppercase">V. RÁPIDAS</span>
                  <span className="text-2xl font-f1-bold italic">
                    {driverStats.fastestLaps || '--'}
                  </span>
                </div>
                <div className="bg-f1-black/5 p-4 rounded-sm text-center">
                  <Hash size={24} className="mx-auto mb-2 text-f1-black/40" />
                  <span className="block text-[10px] font-black opacity-40 uppercase">MEJOR POS.</span>
                  <span className="text-2xl font-f1-bold italic">
                    {driverStats.bestPosition ? `#${driverStats.bestPosition}` : '--'}
                  </span>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: History & Bio */}
          <div className="lg:col-span-2 space-y-12">
            <section>
              <h3 className="text-xs font-black uppercase tracking-widest mb-10 flex items-center gap-2 border-b border-f1-black/10 pb-2">
                <Calendar size={14} className="text-f1-red" /> PROGRESIÓN EN EL CAMPEONATO
              </h3>
              
              <div className="relative pl-8 space-y-12 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-f1-black/5">
                {history.map((entry, idx) => {
                  return (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="relative"
                    >
                      {/* Timeline Dot */}
                      <div 
                        className="absolute -left-[29px] top-1.5 w-6 h-6 rounded-full border-4 border-white shadow-sm z-10"
                        style={{ backgroundColor: entry.teamColor || '#FF1801' }}
                      />
                      
                      <div className="bg-f1-black/5 p-6 rounded-sm border border-f1-black/5 hover:border-f1-red/20 transition-all group">
                        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-12 mb-6">
                          <div className="flex-shrink-0">
                            <span className="text-2xl font-display font-black italic text-f1-red block mb-1">{entry.seasonYear}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black opacity-40 uppercase tracking-widest">POSICIÓN</span>
                              <span className="text-lg font-display font-bold italic">#{entry.rank}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 flex-grow">
                            <div className="w-12 h-12 bg-white rounded-sm p-2 flex items-center justify-center border border-f1-black/5 group-hover:scale-110 transition-transform">
                              <img src={entry.teamLogo || 'https://via.placeholder.com/100'} alt="" className="max-w-full max-h-full object-contain" />
                            </div>
                            <div>
                              <h4 className="text-sm font-black tracking-wider text-f1-black/80">{entry.teamName}</h4>
                              <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">ESCUDERÍA OFICIAL</p>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="block text-[10px] font-black opacity-40 uppercase tracking-widest mb-1">PUNTOS</span>
                            <span className="text-2xl font-display font-black italic">{entry.points}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                
                {history.length === 0 && (
                  <div className="py-8 text-center text-f1-black/40 italic bg-f1-black/5 rounded-sm">
                    No hay historial de progresión disponible
                  </div>
                )}
              </div>
            </section>

            <section>
              <h3 className="text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-f1-black/10 pb-2">
                <ChartIcon size={14} className="text-f1-red" /> RESULTADOS DE CARRERAS
              </h3>
              <div className="h-[300px] w-full bg-f1-black/5 p-4 rounded-sm">
                {raceResults.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={raceResults.map((r, i) => {
                        const compareResult = compareRaceResults.find(cr => cr.race_id === r.race_id);
                        return {
                          name: r.races?.short_name || r.races?.name?.split(' ')[0] || `R${i+1}`,
                          pos: r.position,
                          comparePos: compareResult?.position,
                          bestLap: r.best_lap,
                          isFastest: r.fastest_lap
                        };
                      })}
                      margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#00000010" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 9, fontWeight: 900, fill: '#00000040' }}
                      />
                      <YAxis 
                        reversed 
                        domain={[1, 'dataMax + 1']} 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fontWeight: 900, fill: '#00000040' }}
                        ticks={[1, 5, 10, 15, 20]}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#15151e', 
                          border: 'none', 
                          borderRadius: '2px',
                          color: '#fff',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          textTransform: 'uppercase'
                        }}
                        itemStyle={{ color: '#fff' }}
                        cursor={{ stroke: '#FF1801', strokeWidth: 1 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="pos" 
                        name={driver.name}
                        stroke="#FF1801" 
                        strokeWidth={3}
                        dot={(props: any) => {
                          const { cx, cy, payload } = props;
                          if (payload.isFastest) {
                            return (
                              <svg x={cx - 6} y={cy - 6} width={12} height={12} fill="#FF1801" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" />
                                <path d="M12 6v6l4 2" stroke="white" strokeWidth="2" strokeLinecap="round" />
                              </svg>
                            );
                          }
                          return <Dot {...props} r={4} fill="#FF1801" stroke="white" strokeWidth={2} />;
                        }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                      {compareDriver && (
                        <Line 
                          type="monotone" 
                          dataKey="comparePos" 
                          name={compareDriver.name}
                          stroke="#38383F" 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={{ r: 3, fill: '#38383F', stroke: 'white', strokeWidth: 1 }}
                          activeDot={{ r: 5, strokeWidth: 0 }}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-f1-black/40 italic text-xs">
                    No hay datos de carrera disponibles
                  </div>
                )}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-[8px] font-black uppercase tracking-widest opacity-40">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-f1-red" /> {driver.name}
                </div>
                {compareDriver && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-f1-gray" /> {compareDriver.name}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-f1-red border border-white flex items-center justify-center">
                    <div className="w-0.5 h-0.5 bg-white rounded-full" />
                  </div> MEJOR VUELTA
                </div>
              </div>

              {/* Detailed Race Results Table */}
              <div className="mt-12 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-f1-black/10">
                      <th className="py-3 text-[10px] font-black uppercase tracking-widest opacity-40">CARRERA</th>
                      <th className="py-3 text-[10px] font-black uppercase tracking-widest opacity-40 text-center">POS</th>
                      <th className="py-3 text-[10px] font-black uppercase tracking-widest opacity-40 text-right">MEJOR VUELTA</th>
                      <th className="py-3 text-[10px] font-black uppercase tracking-widest opacity-40 text-right">INFO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-f1-black/5">
                    {[...raceResults].sort((a, b) => {
                      const dateA = new Date(a.races?.race_date || 0).getTime();
                      const dateB = new Date(b.races?.race_date || 0).getTime();
                      return dateB - dateA;
                    }).map((result, idx) => (
                      <tr key={idx} className="hover:bg-f1-black/5 transition-colors group">
                        <td className="py-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-black uppercase tracking-tight group-hover:text-f1-red transition-colors">
                              {result.races?.name}
                            </span>
                            <span className="text-[9px] font-bold opacity-40 uppercase tracking-widest">
                              {result.races?.race_date ? new Date(result.races.race_date).getFullYear() : '--'}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 text-center">
                          <span className={`text-sm font-display font-black italic ${result.position === 1 ? 'text-f1-red' : ''}`}>
                            #{result.position}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {result.fastest_lap && (
                              <Timer size={12} className="text-f1-red animate-pulse" />
                            )}
                            <span className="text-xs font-mono font-bold">
                              {result.best_lap || '--:--.---'}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 text-right">
                          {result.race_sessions?.session_pdf?.[0]?.url_pdf && (
                            <a 
                              href={result.race_sessions.session_pdf[0].url_pdf} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center p-2 bg-f1-black/5 hover:bg-f1-red hover:text-white rounded-sm transition-all"
                              title="Ver PDF de la sesión"
                            >
                              <FileText size={14} />
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Compare Modal */}
      <AnimatePresence>
        {showCompareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCompareModal(false)}
              className="absolute inset-0 bg-f1-black/90 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-sm overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-f1-black/10 flex justify-between items-center bg-f1-black text-white">
                <h3 className="font-display font-black italic uppercase tracking-widest">SELECCIONAR PILOTO</h3>
                <button onClick={() => setShowCompareModal(false)} className="hover:text-f1-red transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6">
                <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-f1-black/40" size={18} />
                  <input 
                    type="text"
                    placeholder="BUSCAR POR NOMBRE..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-f1-black/5 border-none rounded-sm font-bold uppercase tracking-widest text-xs focus:ring-2 focus:ring-f1-red outline-none"
                  />
                </div>

                <div className="max-h-96 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {filteredDrivers.map(d => (
                    <button
                      key={d.id}
                      onClick={() => handleCompare(d)}
                      className="w-full flex items-center gap-4 p-3 hover:bg-f1-black/5 rounded-sm transition-colors text-left group"
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-f1-black/10 bg-f1-black/5">
                        <img src={d.image} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-black tracking-tighter text-sm leading-none mb-1">{d.name}</p>
                        <p className="text-[10px] font-bold opacity-40 tracking-widest">{d.team?.name}</p>
                      </div>
                      <div className="ml-auto">
                        <span className="text-xs font-black italic text-f1-red">#{d.rank}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DriverProfile;
