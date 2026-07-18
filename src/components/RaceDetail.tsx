import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Race, fetchRaces, RaceSession, RaceResult, fetchSessions, fetchRaceResults, fetchSessionLaps, SessionLap, Video, fetchVideosBySession, fetchCircuitBestLaps, fetchCircuitDetails } from '../types';
import { ChevronLeft, MapPin, Calendar, ExternalLink, Info, Flag, Trophy, Timer, Hash, List, X, BarChart2, ZoomIn, ZoomOut, RotateCcw, Play, Copy, Check, FileText, Award, LineChart as LineChartIcon } from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { fetchDrivers, Driver } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const RaceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [race, setRace] = useState<Race | null>(null);
  const [sessions, setSessions] = useState<RaceSession[]>([]);
  const [results, setResults] = useState<{[key: number]: RaceResult[]}>({});
  const [sessionVideos, setSessionVideos] = useState<{[key: number]: Video[]}>({});
  const [loading, setLoading] = useState(true);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [selectedDriverLaps, setSelectedDriverLaps] = useState<{driverName: string, laps: SessionLap[]} | null>(null);
  const [bestLaps, setBestLaps] = useState<{raceBestLaps: any[], qualyBestLaps: any[]}>({ raceBestLaps: [], qualyBestLaps: [] });
  const [compareMode, setCompareMode] = useState(false);
  const [compareDriverIds, setCompareDriverIds] = useState<number[]>([]);
  const [comparisonData, setComparisonData] = useState<{[key: number]: SessionLap[]}>({});
  const [driversInfo, setDriversInfo] = useState<Driver[]>([]);
  const [copySuccess, setCopySuccess] = useState(false);
  const [allSessionLaps, setAllSessionLaps] = useState<SessionLap[]>([]);
  const [showLapChart, setShowLapChart] = useState(false);
  const [hoveredDriver, setHoveredDriver] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const races = await fetchRaces();
      const numericId = Number(id);
      const foundRace = races.find(r => r.id === numericId);
      
      if (foundRace) {
        setRace(foundRace);
        
        // Fetch drivers info for the season to get team logos/colors
        if (foundRace.seasonYear) {
          const drivers = await fetchDrivers(foundRace.seasonYear);
          setDriversInfo(drivers);
        }

        const raceSessions = await fetchSessions(foundRace.id);
        setSessions(raceSessions);
        
        if (foundRace.circuit_id) {
          const [laps, details] = await Promise.all([
            fetchCircuitBestLaps(foundRace.circuit_id),
            fetchCircuitDetails(foundRace.circuit_id)
          ]);
          setBestLaps(laps);
          if (details) {
            setRace(prev => prev ? { ...prev, circuit_details: details } : null);
          }
        }
        
        if (raceSessions.length > 0) {
          setActiveSessionId(raceSessions[0].id);
          const resultsMap: {[key: number]: RaceResult[]} = {};
          const videosMap: {[key: number]: Video[]} = {};
          
          await Promise.all(raceSessions.map(async (session) => {
            const [res, videos] = await Promise.all([
              fetchRaceResults(foundRace.id, session.id),
              fetchVideosBySession(session.id)
            ]);
            resultsMap[session.id] = res;
            videosMap[session.id] = videos;
          }));
          setResults(resultsMap);
          setSessionVideos(videosMap);
        }
      }
      setLoading(false);
    };
    loadData();
  }, [id]);

  const handleViewLaps = async (sessionId: number, driverId: number, driverName: string) => {
    const laps = await fetchSessionLaps(sessionId, driverId);
    setSelectedDriverLaps({ driverName, laps });
  };

  const toggleCompareDriver = (driverId: number) => {
    setCompareDriverIds(prev => 
      prev.includes(driverId) 
        ? prev.filter(id => id !== driverId) 
        : [...prev, driverId]
    );
  };

  const copyResultsToClipboard = () => {
    if (!activeSessionId || !results[activeSessionId] || !race) return;
    
    const sessionResults = results[activeSessionId];
    const activeSession = sessions.find(s => s.id === activeSessionId);
    
    let text = `RESULTADOS: ${race.name.toUpperCase()} - ${activeSession?.name.toUpperCase()}\n`;
    text += `Fecha: ${race.date} | Ubicación: ${race.location}\n\n`;
    text += "POS | PILOTO               | KART | TIEMPO/DIF  | MEJOR VTA  | PUNTOS\n";
    text += "----------------------------------------------------------------------\n";
    
    sessionResults.forEach(res => {
      const driverName = `${(res as any).drivers?.first_name} ${(res as any).drivers?.last_name}`;
      const pos = res.position.toString().padEnd(3);
      const name = driverName.padEnd(20);
      const kart = (res.kart_number || '-').toString().padEnd(4);
      const time = (res.time_gap || '--:--.---').padEnd(11);
      const best = (res.best_lap || '--:--.---').padEnd(10);
      const pts = res.points_earned || 0;
      
      text += `${pos} | ${name} | ${kart} | ${time} | ${best} | ${pts}\n`;
    });
    
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  useEffect(() => {
    const loadComparisonData = async () => {
      if (compareMode && activeSessionId && compareDriverIds.length > 0) {
        const data: {[key: number]: SessionLap[]} = {};
        await Promise.all(compareDriverIds.map(async (id) => {
          const laps = await fetchSessionLaps(activeSessionId, id);
          data[id] = laps;
        }));
        setComparisonData(data);
      }
    };
    loadComparisonData();
  }, [compareMode, activeSessionId, compareDriverIds]);

  useEffect(() => {
    const loadAllLaps = async () => {
      if (activeSessionId) {
        const laps = await fetchSessionLaps(activeSessionId);
        setAllSessionLaps(laps);
      } else {
        setAllSessionLaps([]);
      }
    };
    loadAllLaps();
  }, [activeSessionId]);

  const canShowLapChart = allSessionLaps.length > 0 && allSessionLaps.every(lap => lap.lap_position !== null);

  const prepareLapChartData = () => {
    if (!activeSessionId || !results[activeSessionId]) return [];
    
    const sessionResults = results[activeSessionId];
    const lapsByNumber: { [key: number]: any } = {};
    
    // Lap 0: Grid Positions
    lapsByNumber[0] = { lap: 0 };
    sessionResults.forEach(res => {
      const driver = driversInfo.find(d => d.id === res.driver_id);
      const driverName = driver ? driver.name : `Piloto ${res.driver_id}`;
      if (res.grid_position) {
        lapsByNumber[0][driverName] = res.grid_position;
      }
    });

    // Subsequent Laps
    allSessionLaps.forEach(lap => {
      if (!lapsByNumber[lap.lap_number]) {
        lapsByNumber[lap.lap_number] = { lap: lap.lap_number };
      }
      const driver = driversInfo.find(d => d.id === lap.driver_id);
      const driverName = driver ? driver.name : `Piloto ${lap.driver_id}`;
      lapsByNumber[lap.lap_number][driverName] = lap.lap_position;
      lapsByNumber[lap.lap_number][`${driverName}_time`] = lap.lap_time;
    });

    return Object.values(lapsByNumber).sort((a, b) => a.lap - b.lap);
  };

  const getDriverColor = (driverName: string) => {
    const driver = driversInfo.find(d => d.name === driverName);
    return driver?.team?.color || '#ef4444';
  };

  const getGridMapping = () => {
    if (!activeSessionId || !results[activeSessionId]) return {};
    const mapping: { [key: number]: { name: string, color: string } } = {};
    results[activeSessionId].forEach(res => {
      const pos = res.grid_position || res.position;
      if (pos) {
        const driver = driversInfo.find(d => d.id === res.driver_id);
        mapping[pos] = {
          name: driver ? driver.name : `Piloto ${res.driver_id}`,
          color: driver?.team?.color || '#ef4444'
        };
      }
    });
    return mapping;
  };

  if (loading) return <div className="py-24 text-center">Cargando carrera...</div>;
  if (!race) return <div className="py-24 text-center">Carrera no encontrada</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-24">
      <Link 
        to="/calendario" 
        className="inline-flex items-center gap-2 text-f1-black/60 hover:text-f1-red transition-colors mb-12 font-bold uppercase text-xs tracking-widest"
      >
        <ChevronLeft size={16} /> VOLVER AL CALENDARIO
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-24">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <span className="bg-f1-red text-white text-[10px] font-black px-2 py-1 rounded-sm uppercase tracking-widest">
              {race.status === 'completed' ? 'FINALIZADO' : 'PRÓXIMO'}
            </span>
            <span className="text-f1-black/40 font-black uppercase text-xs tracking-widest flex items-center gap-1">
              <Calendar size={14} /> {race.date}
            </span>
            <span className="text-f1-black/40 font-black uppercase text-xs tracking-widest">
              TEMPORADA {race.seasonYear}
            </span>
          </div>
          <h1 className="text-5xl font-f1-wide italic font-black uppercase tracking-tighter mb-4">{race.name}</h1>
          <div className="flex items-center gap-2 text-f1-black/60 font-bold uppercase text-sm mb-8">
            <MapPin size={18} className="text-f1-red" /> {race.location}
          </div>

          <div className="prose prose-f1 max-w-none mb-12">
            <h3 className="text-xl italic font-black uppercase mb-4 flex items-center gap-2">
              <Info size={20} className="text-f1-red" /> INFORMACIÓN DEL CIRCUITO
            </h3>
            <p className="text-f1-black/60 leading-relaxed">
              {race.description || 'Información detallada sobre el trazado y las características de este Gran Premio. El circuito ofrece un desafío único para los pilotos de Pentekarts.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            {race.officialWeb && (
              <a 
                href={race.officialWeb} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-f1-black text-white px-6 py-3 rounded-sm font-black uppercase tracking-widest hover:bg-f1-red transition-colors"
              >
                WEB OFICIAL <ExternalLink size={16} />
              </a>
            )}
            <button className="inline-flex items-center gap-2 border-2 border-f1-black px-6 py-3 rounded-sm font-black uppercase tracking-widest hover:bg-f1-black hover:text-white transition-colors">
              RESULTADOS <Flag size={16} />
            </button>
          </div>
        </div>

        <div className="relative bg-f1-black/5 rounded-sm overflow-hidden flex flex-col items-center justify-center border-2 border-f1-black/10 min-h-[500px]">
          {race.trackMap ? (
            <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
              <TransformWrapper
                initialScale={1}
                minScale={0.5}
                maxScale={4}
                centerOnInit={true}
              >
                {({ zoomIn, zoomOut, resetTransform }) => (
                  <>
                    <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                      <button 
                        onClick={() => zoomIn()}
                        className="p-2 bg-white/80 backdrop-blur-sm hover:bg-f1-red hover:text-white rounded-sm border border-f1-black/10 transition-all shadow-sm"
                        title="Acercar"
                      >
                        <ZoomIn size={18} />
                      </button>
                      <button 
                        onClick={() => zoomOut()}
                        className="p-2 bg-white/80 backdrop-blur-sm hover:bg-f1-red hover:text-white rounded-sm border border-f1-black/10 transition-all shadow-sm"
                        title="Alejar"
                      >
                        <ZoomOut size={18} />
                      </button>
                      <button 
                        onClick={() => resetTransform()}
                        className="p-2 bg-white/80 backdrop-blur-sm hover:bg-f1-red hover:text-white rounded-sm border border-f1-black/10 transition-all shadow-sm"
                        title="Restablecer"
                      >
                        <RotateCcw size={18} />
                      </button>
                    </div>
                    <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-full !h-full flex items-center justify-center">
                      <img 
                        src={race.trackMap} 
                        alt="Mapa del circuito" 
                        className="max-w-full max-h-[450px] object-contain drop-shadow-2xl cursor-grab active:cursor-grabbing"
                        referrerPolicy="no-referrer"
                      />
                    </TransformComponent>
                  </>
                )}
              </TransformWrapper>
              <div className="absolute bottom-4 left-4 text-[8px] font-black uppercase opacity-30 pointer-events-none">
                Usa el ratón para hacer zoom y arrastrar
              </div>
            </div>
          ) : (
            <div className="text-center text-f1-black/20 p-12">
              <MapPin size={64} className="mx-auto mb-4" />
              <p className="font-black uppercase tracking-widest">Mapa no disponible</p>
            </div>
          )}
          <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-sm border border-f1-black/10 z-10">
            <p className="text-[10px] font-black uppercase opacity-40">Tipo de Circuito</p>
            <p className="font-bold uppercase text-xs">{race.circuit_details?.circuit_type || 'Outdoor / Técnico'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
        <div className="bg-white p-8 border-t-4 border-f1-red shadow-sm">
          <h4 className="text-xs font-black opacity-40 uppercase tracking-widest mb-2">Longitud</h4>
          <p className="text-2xl font-black italic">{race.circuit_details?.length_m ? `${race.circuit_details.length_m} m` : '-- m'}</p>
        </div>
        <div className="bg-white p-8 border-t-4 border-f1-red shadow-sm">
          <h4 className="text-xs font-black opacity-40 uppercase tracking-widest mb-2">Curvas</h4>
          <p className="text-2xl font-black italic">{race.circuit_details?.turns || '--'}</p>
        </div>
        <div className="bg-white p-8 border-t-4 border-f1-red shadow-sm">
          <h4 className="text-xs font-black opacity-40 uppercase tracking-widest mb-2">Récord de Vuelta</h4>
          <p className="text-2xl font-black italic">{race.circuit_details?.lap_record || '--:--.---'}</p>
        </div>
      </div>

      {/* Historical Best Laps Section */}
      {(bestLaps.raceBestLaps.length > 0 || bestLaps.qualyBestLaps.length > 0) && (
        <div className="mb-24">
          <h3 className="text-2xl font-f1-wide italic font-black uppercase tracking-tighter mb-8 border-b-2 border-f1-red pb-4">
            MEJORES VUELTAS HISTÓRICAS
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h4 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                <Timer size={16} className="text-f1-red" /> EN CARRERA (FASTEST LAP)
              </h4>
              <div className="space-y-4">
                {bestLaps.raceBestLaps.map((lap, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-f1-black/5 rounded-sm">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-f1-bold uppercase">{lap.driver}</p>
                        {lap.kart && (
                          <span className="bg-f1-red text-white text-[8px] font-black px-1.5 py-0.5 rounded-sm">
                            #{lap.kart}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-black opacity-40 uppercase tracking-widest">Temporada {lap.year}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-f1-bold italic text-f1-red">{lap.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                <Award size={16} className="text-f1-red" /> EN CLASIFICACIÓN (POLE)
              </h4>
              <div className="space-y-4">
                {bestLaps.qualyBestLaps.map((lap, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-f1-black/5 rounded-sm">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-f1-bold uppercase">{lap.driver}</p>
                        {lap.kart && (
                          <span className="bg-f1-red text-white text-[8px] font-black px-1.5 py-0.5 rounded-sm">
                            #{lap.kart}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-black opacity-40 uppercase tracking-widest">Temporada {lap.year}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-f1-bold italic text-f1-red">{lap.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      {sessions.length > 0 && (
        <div className="mt-24">
          <div className="flex items-center justify-between mb-12 border-b-2 border-f1-red pb-4">
            <h2 className="text-4xl font-f1-wide italic font-black uppercase tracking-tighter">RESULTADOS POR SESIÓN</h2>
            <div className="flex items-center gap-4">
              <button 
                onClick={copyResultsToClipboard}
                className="flex items-center gap-2 px-4 py-2 rounded-sm font-black uppercase text-[10px] tracking-widest transition-all bg-f1-black/5 text-f1-black/40 hover:bg-f1-black/10 hover:text-f1-black"
                title="Copiar resultados al portapapeles"
              >
                {copySuccess ? <Check size={14} className="text-green-600" /> : <Copy size={14} />} 
                {copySuccess ? 'COPIADO' : 'COPIAR DATOS'}
              </button>
              <button 
                onClick={() => {
                  setCompareMode(!compareMode);
                  if (!compareMode) setCompareDriverIds([]);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-sm font-black uppercase text-[10px] tracking-widest transition-all ${
                  compareMode ? 'bg-f1-red text-white' : 'bg-f1-black/5 text-f1-black/40 hover:bg-f1-black/10'
                }`}
              >
                <BarChart2 size={14} /> {compareMode ? 'CANCELAR COMPARACIÓN' : 'COMPARAR PILOTOS'}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            {sessions.map(session => (
              <button
                key={session.id}
                onClick={() => {
                  setActiveSessionId(session.id);
                  if (compareMode) setCompareDriverIds([]);
                }}
                className={`px-6 py-3 rounded-sm font-black uppercase tracking-widest text-xs transition-all ${
                  activeSessionId === session.id 
                    ? 'bg-f1-red text-white' 
                    : 'bg-f1-black/5 text-f1-black/40 hover:bg-f1-black/10'
                }`}
              >
                {session.name}
              </button>
            ))}
          </div>

          {activeSessionId && (
            <div className="flex flex-wrap gap-4 mb-8">
              {/* PDF Buttons */}
              {sessions.find(s => s.id === activeSessionId)?.session_pdf?.map((pdf, idx) => (
                <a
                  key={`pdf-${idx}`}
                  href={pdf.url_pdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-f1-red text-white px-4 py-2 rounded-sm font-black uppercase tracking-widest text-[10px] hover:bg-f1-black transition-colors"
                >
                  <FileText size={14} /> VER PDF: {sessions.find(s => s.id === activeSessionId)?.name}
                </a>
              ))}

              {/* Video Buttons */}
              {sessionVideos[activeSessionId]?.map(video => (
                <a
                  key={video.id}
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-f1-black text-white px-4 py-2 rounded-sm font-black uppercase tracking-widest text-[10px] hover:bg-f1-red transition-colors"
                >
                  <Play size={14} fill="currentColor" /> VER VIDEO: {video.title}
                </a>
              ))}

              {/* Lap Chart Button */}
              {canShowLapChart && (
                <button
                  onClick={() => setShowLapChart(true)}
                  className="inline-flex items-center gap-2 bg-f1-black text-white px-4 py-2 rounded-sm font-black uppercase tracking-widest text-[10px] hover:bg-f1-red transition-colors"
                >
                  <LineChartIcon size={14} /> GRÁFICO DE VUELTAS
                </button>
              )}
            </div>
          )}

          <AnimatePresence mode="wait">
            {activeSessionId && (
              <motion.div
                key={activeSessionId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-sm border border-f1-black/10 overflow-hidden"
              >
                <div className="overflow-x-auto">
                  {(() => {
                    const sessionResults = results[activeSessionId] || [];
                    const activeSession = sessions.find(s => s.id === activeSessionId);
                    const isRaceSession = activeSession?.name.toLowerCase().includes('carrera');
                    const hasBestLap = sessionResults.some(r => r.best_lap);
                    const hasKart = sessionResults.some(r => r.kart_number);

                    return (
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-f1-black text-white font-black uppercase text-[10px] tracking-widest">
                            {compareMode && <th className="p-4 w-10"></th>}
                            <th className="p-4"><Hash size={14} /></th>
                            <th className="p-4">PILOTO</th>
                            {hasKart && <th className="p-4">KART</th>}
                            <th className="p-4">TIEMPO / DIF.</th>
                            {hasBestLap && <th className="p-4">MEJOR VUELTA</th>}
                            {isRaceSession && <th className="p-4">PARRILLA</th>}
                            {isRaceSession && <th className="p-4 text-right">PUNTOS</th>}
                            <th className="p-4"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {sessionResults.length > 0 ? (
                            sessionResults.map((res, idx) => {
                              const driverName = `${(res as any).drivers?.first_name} ${(res as any).drivers?.last_name}`;
                              return (
                                <tr 
                                  key={res.id || idx} 
                                  className={`border-b border-f1-black/5 hover:bg-f1-black/5 transition-colors group ${
                                    compareMode && compareDriverIds.includes(res.driver_id) ? 'bg-f1-red/5' : ''
                                  }`}
                                >
                                  {compareMode && (
                                    <td className="p-4">
                                      <input 
                                        type="checkbox" 
                                        checked={compareDriverIds.includes(res.driver_id)}
                                        onChange={() => toggleCompareDriver(res.driver_id)}
                                        className="w-4 h-4 accent-f1-red"
                                      />
                                    </td>
                                  )}
                                  <td className="p-4">
                                    <span className={`w-8 h-8 flex items-center justify-center font-black italic text-lg ${
                                      res.position === 1 ? 'text-f1-red' : 'text-f1-black/40'
                                    }`}>
                                      {res.position}
                                    </span>
                                  </td>
                                  <td className="p-4">
                                    <div className="flex items-center gap-3 relative group/driver">
                                      <div className="w-1 h-8 bg-f1-red opacity-0 group-hover:opacity-100 transition-opacity" />
                                      <div className="relative">
                                        <p className="font-f1-bold italic tracking-tighter text-lg leading-none cursor-default">
                                          {driverName}
                                        </p>
                                        {res.fastest_lap && (
                                          <span className="text-[8px] font-black uppercase text-f1-red flex items-center gap-1 mt-1">
                                            <Timer size={10} /> VUELTA RÁPIDA
                                          </span>
                                        )}

                                        {/* Hover Details Card */}
                                        <motion.div 
                                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                          whileHover={{ opacity: 1, y: 0, scale: 1 }}
                                          className="absolute left-0 top-full mt-2 z-30 opacity-0 pointer-events-none group-hover/driver:opacity-100 group-hover/driver:pointer-events-auto transition-all duration-200"
                                        >
                                          {(() => {
                                            const driverDetail = driversInfo.find(d => d.id === res.driver_id);
                                            if (!driverDetail) return null;
                                            return (
                                              <div className="bg-f1-black text-white p-4 rounded-sm shadow-2xl border border-white/10 w-64 flex gap-4">
                                                <div className="flex-shrink-0 w-16 h-16 bg-white/5 rounded-sm overflow-hidden border border-white/10">
                                                  {driverDetail.image ? (
                                                    <img src={driverDetail.image} alt={driverName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                                  ) : (
                                                    <div className="w-full h-full flex items-center justify-center opacity-20"><Trophy size={24} /></div>
                                                  )}
                                                </div>
                                                <div className="flex-grow min-w-0">
                                                  <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Equipo</p>
                                                  <div className="flex items-center gap-2 mb-2">
                                                    {driverDetail.team?.logo && (
                                                      <img src={driverDetail.team.logo} alt={driverDetail.team.name} className="w-4 h-4 object-contain" referrerPolicy="no-referrer" />
                                                    )}
                                                    <p className="font-bold text-xs truncate" style={{ color: driverDetail.team?.color }}>
                                                      {driverDetail.team?.name}
                                                    </p>
                                                  </div>
                                                  <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                      <p className="text-[8px] font-black uppercase opacity-40">Puntos</p>
                                                      <p className="font-black italic text-sm">{driverDetail.points}</p>
                                                    </div>
                                                    <div>
                                                      <p className="text-[8px] font-black uppercase opacity-40">Rank</p>
                                                      <p className="font-black italic text-sm">#{driverDetail.rank}</p>
                                                    </div>
                                                  </div>
                                                  {res.fastest_lap && (
                                                    <div className="mt-2 pt-2 border-t border-white/10">
                                                      <p className="text-[8px] font-black uppercase text-f1-red flex items-center gap-1">
                                                        <Timer size={10} /> VUELTA RÁPIDA
                                                      </p>
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            );
                                          })()}
                                        </motion.div>
                                      </div>
                                    </div>
                                  </td>
                                  {hasKart && (
                                    <td className="p-4 font-bold text-f1-black/60">
                                      #{res.kart_number}
                                    </td>
                                  )}
                                  <td className="p-4 font-mono text-sm text-f1-black/60">
                                    {res.time_gap || '--:--.---'}
                                  </td>
                                  {hasBestLap && (
                                    <td className="p-4 font-mono text-sm text-f1-red font-bold">
                                      {res.best_lap || '--:--.---'}
                                    </td>
                                  )}
                                  {isRaceSession && (
                                    <td className="p-4 text-sm font-bold text-f1-black/40">
                                      {res.grid_position ? `P${res.grid_position}` : '-'}
                                    </td>
                                  )}
                                  {isRaceSession && (
                                    <td className="p-4 text-right">
                                      <span className="inline-block bg-f1-black/5 px-3 py-1 rounded-sm font-f1-bold italic text-lg">
                                        {res.points_earned}
                                      </span>
                                    </td>
                                  )}
                                  <td className="p-4 text-right">
                                    <button 
                                      onClick={() => handleViewLaps(activeSessionId, res.driver_id, driverName)}
                                      className="p-2 text-f1-black/20 hover:text-f1-red transition-colors"
                                      title="Ver vueltas"
                                    >
                                      <List size={16} />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={compareMode ? 9 : 8} className="p-12 text-center text-f1-black/40 font-bold uppercase tracking-widest">
                                No hay resultados disponibles para esta sesión
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    );
                  })()}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Comparison View */}
          {compareMode && compareDriverIds.length > 0 && (
            <div className="mt-12 bg-f1-black text-white p-8 rounded-sm">
              <h3 className="text-xl font-display font-black italic uppercase mb-8 border-b border-white/10 pb-4">
                COMPARATIVA DE TIEMPOS
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[10px] font-black uppercase tracking-widest opacity-40">
                      <th className="p-4">VUELTA</th>
                      {compareDriverIds.map(id => {
                        const res = (results[activeSessionId!] || []).find(r => r.driver_id === id);
                        return (
                          <th key={id} className="p-4">
                            {(res as any)?.drivers?.first_name} {(res as any)?.drivers?.last_name}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const maxLaps = Math.max(...(Object.values(comparisonData) as SessionLap[][]).map(laps => laps.length), 0);
                      if (maxLaps === 0) return (
                        <tr>
                          <td colSpan={compareDriverIds.length + 1} className="p-8 text-center opacity-40 font-bold uppercase tracking-widest">
                            Cargando datos de vueltas...
                          </td>
                        </tr>
                      );

                      return Array.from({ length: maxLaps }).map((_, i) => (
                        <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="p-4 font-black italic opacity-40">L{i + 1}</td>
                          {compareDriverIds.map(id => {
                            const lap = comparisonData[id]?.find(l => l.lap_number === i + 1);
                            return (
                              <td key={id} className="p-4 font-mono text-sm">
                                {lap ? (
                                  <div className="flex items-center gap-2">
                                    <span>{lap.lap_time}</span>
                                    <span className="text-[8px] opacity-40">P{lap.lap_position}</span>
                                  </div>
                                ) : '-'}
                              </td>
                            );
                          })}
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Laps Modal */}
      <AnimatePresence>
        {selectedDriverLaps && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-f1-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-sm flex flex-col"
            >
              <div className="p-6 border-b border-f1-black/10 flex items-center justify-between bg-f1-red text-white">
                <div>
                  <h3 className="text-xl font-f1-bold italic">Vueltas: {selectedDriverLaps.driverName}</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Desglose por vuelta</p>
                </div>
                <button 
                  onClick={() => setSelectedDriverLaps(null)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-grow overflow-y-auto p-6">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[10px] font-black uppercase tracking-widest opacity-40 border-b border-f1-black/10">
                      <th className="py-2">VUELTA</th>
                      <th className="py-2">TIEMPO</th>
                      <th className="py-2">POSICIÓN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDriverLaps.laps.length > 0 ? (
                      selectedDriverLaps.laps.map((lap) => (
                        <tr key={lap.id} className="border-b border-f1-black/5 hover:bg-f1-black/5 transition-colors">
                          <td className="py-3 font-black italic text-f1-black/40">#{lap.lap_number}</td>
                          <td className="py-3 font-mono font-bold">{lap.lap_time}</td>
                          <td className="py-3">
                            <span className="inline-block bg-f1-black/5 px-2 py-1 rounded-sm font-black text-xs">
                              P{lap.lap_position}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-12 text-center text-f1-black/40 font-bold uppercase tracking-widest">
                          No hay datos de vueltas disponibles
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Lap Chart Modal */}
      <AnimatePresence>
        {showLapChart && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-f1-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-6xl h-[90vh] md:h-[80vh] rounded-sm shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-4 md:p-6 border-b border-f1-black/10 flex items-center justify-between bg-f1-black text-white">
                <div>
                  <h3 className="text-lg md:text-xl font-f1-bold italic uppercase">Gráfico de Posiciones</h3>
                  <p className="text-[8px] md:text-[10px] font-black opacity-60 uppercase tracking-widest">
                    {race.name} - {sessions.find(s => s.id === activeSessionId)?.name}
                  </p>
                </div>
                <button 
                  onClick={() => setShowLapChart(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={20} className="md:w-[24px] md:h-[24px]" />
                </button>
              </div>
              
              <div className="flex-grow p-2 md:p-8 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={prepareLapChartData()}
                    margin={{ top: 20, right: 20, left: isMobile ? 40 : 150, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis 
                      dataKey="lap" 
                      label={!isMobile ? { value: 'VUELTA', position: 'insideBottom', offset: -10, fontSize: 10, fontWeight: 'black' } : undefined} 
                      tick={{ fontSize: 8, fontWeight: 'bold' }}
                    />
                    <YAxis 
                      reversed 
                      domain={(() => {
                        const data = prepareLapChartData();
                        const sessionResults = results[activeSessionId] || [];
                        let maxPos = sessionResults.length;
                        data.forEach(d => {
                          Object.keys(d).forEach(key => {
                            if (key !== 'lap' && !key.endsWith('_time')) {
                              maxPos = Math.max(maxPos, d[key]);
                            }
                          });
                        });
                        return [1, maxPos || 20];
                      })()}
                      allowDecimals={false}
                      interval={0}
                      minTickGap={0}
                      width={isMobile ? 40 : 220}
                      ticks={(() => {
                        const data = prepareLapChartData();
                        const sessionResults = results[activeSessionId] || [];
                        let maxPos = sessionResults.length;
                        data.forEach(d => {
                          Object.keys(d).forEach(key => {
                            if (key !== 'lap' && !key.endsWith('_time')) {
                              maxPos = Math.max(maxPos, d[key]);
                            }
                          });
                        });
                        return Array.from({ length: maxPos || 0 }, (_, i) => i + 1);
                      })()}
                      tick={(props) => {
                        const { x, y, payload } = props;
                        const mapping = getGridMapping();
                        const data = mapping[payload.value];
                        
                        if (isMobile) {
                          return (
                            <text x={x} y={y} dy={4} textAnchor="end" fontSize={8} fontWeight="bold" fill="#15151E">
                              {payload.value}
                            </text>
                          );
                        }

                        if (!data) return <text x={x} y={y} dy={4} textAnchor="end" fontSize={10} fontWeight="bold">{payload.value}</text>;
                        
                        return (
                          <g 
                            transform={`translate(${x},${y})`}
                            onMouseEnter={() => setHoveredDriver(data.name)}
                            onMouseLeave={() => setHoveredDriver(null)}
                            style={{ cursor: 'pointer' }}
                          >
                            <circle cx={-205} cy={0} r={4} fill={data.color} />
                            <text 
                              x={-195} 
                              y={0} 
                              dy={4} 
                              textAnchor="start" 
                              fontSize={10} 
                              fontWeight="black" 
                              fill={hoveredDriver === data.name ? data.color : '#15151E'}
                              style={{ textTransform: 'uppercase' }}
                            >
                              {data.name} - {payload.value}
                            </text>
                          </g>
                        );
                      }}
                    />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const sortedPayload = [...payload].sort((a, b) => (a.value as number) - (b.value as number));
                          return (
                            <div className="bg-white border border-f1-black p-2 md:p-3 shadow-xl max-h-[60vh] overflow-y-auto">
                              <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest mb-2 border-b border-f1-black/10 pb-1">
                                Vuelta {label}
                              </p>
                              <div className="space-y-1">
                                {sortedPayload.map((entry: any) => {
                                  const timeKey = `${entry.name}_time`;
                                  const lapTime = entry.payload[timeKey];
                                  return (
                                    <div key={entry.name} className="flex items-center justify-between gap-2 md:gap-4">
                                      <div className="flex items-center gap-1 md:gap-2">
                                        <div className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                        <span className="text-[8px] md:text-[10px] font-bold uppercase truncate max-w-[60px] md:max-w-none">{entry.name}</span>
                                      </div>
                                      <div className="flex items-center gap-1 md:gap-2">
                                        <span className="text-[8px] md:text-[10px] font-black">P{entry.value}</span>
                                        {lapTime && !isMobile && <span className="text-[9px] font-mono opacity-60">{lapTime}</span>}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    {(() => {
                      const data = prepareLapChartData();
                      if (data.length === 0) return null;
                      const drivers = Object.keys(data[0]).filter(key => key !== 'lap' && !key.endsWith('_time'));
                      return drivers.map((driverName) => (
                        <Line
                          key={driverName}
                          type="monotone"
                          dataKey={driverName}
                          stroke={getDriverColor(driverName)}
                          strokeWidth={hoveredDriver === driverName ? 5 : 2}
                          strokeOpacity={hoveredDriver ? (hoveredDriver === driverName ? 1 : 0.2) : 1}
                          dot={{ r: 3, strokeWidth: 1 }}
                          activeDot={{ r: 6, strokeWidth: 2 }}
                          animationDuration={500}
                          onMouseEnter={() => setHoveredDriver(driverName)}
                          onMouseLeave={() => setHoveredDriver(null)}
                        />
                      ));
                    })()}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="p-4 bg-f1-black/5 border-t border-f1-black/10 text-center">
                <p className="text-[10px] font-black opacity-40 uppercase tracking-widest">
                  La vuelta 0 representa la posición en parrilla (Grid Position)
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RaceDetail;
