import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchDrivers, fetchTeams, fetchLatestRace, fetchSiteSettings, Driver, Team, Race, SiteSettings } from '../types';
import Countdown from './Countdown';

const Hero = () => {
  const [leader, setLeader] = useState<Driver | null>(null);
  const [constructorsLeader, setConstructorsLeader] = useState<Team | null>(null);
  const [nextRace, setNextRace] = useState<Race | null>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const currentSeason = '2026';

  useEffect(() => {
    fetchDrivers(currentSeason).then(drivers => {
      if (drivers.length > 0) setLeader(drivers[0]);
    });
    fetchTeams(currentSeason).then(teams => {
      if (teams.length > 0) setConstructorsLeader(teams[0]);
    });
    fetchLatestRace(currentSeason).then(race => {
      setNextRace(race);
    });
    fetchSiteSettings().then(setSettings);
  }, []);

  return (
    <div className="relative h-[80vh] w-full overflow-hidden bg-white transition-colors duration-300">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img 
          src={settings?.hero_image_url || "https://pentekarts.web.app/images/circuits/fondo-Dakart.png"} 
          alt="Karting action" 
          className="w-full h-full object-cover opacity-80"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-white/30" />
      </div>

      {/* Content */}
      <div className="relative h-full max-w-7xl mx-auto px-4 flex flex-col justify-center">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl"
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-f1-red text-white text-[10px] font-black uppercase px-2 py-0.5 tracking-tighter">EN DIRECTO</span>
            <span className="text-f1-black/60 text-xs font-bold uppercase tracking-widest">TEMPORADA {currentSeason}</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl mb-6 leading-[0.9] italic text-f1-black uppercase font-f1-wide">
            {settings?.hero_title || 'EL FUTURO DEL KARTING'}
          </h1>
          
          <p className="text-lg text-f1-black/80 mb-8 font-medium max-w-lg uppercase">
            {settings?.hero_subtitle || 'Sigue toda la emoción del campeonato Pentekarts. Resultados en tiempo real, equipos, pilotos y mucho más.'}
          </p>

          <div className="flex flex-col lg:flex-row lg:items-center gap-8 mb-12">
            {nextRace?.rawDate && (
              <div className="bg-f1-black/90 backdrop-blur-md p-8 rounded-sm inline-block border-l-8 border-f1-red shadow-2xl skew-x-[-4deg]">
                <div className="skew-x-[4deg]">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-f1-red animate-pulse rounded-full" />
                    PRÓXIMA CARRERA: {nextRace.name.toUpperCase()}
                  </p>
                  <Countdown targetDate={nextRace.rawDate} />
                </div>
              </div>
            )}
            
            <div className="flex flex-col gap-4">
              <Link to="/calendario" className="bg-f1-red hover:bg-red-700 text-white px-8 py-4 font-bold uppercase tracking-widest flex items-center gap-2 transition-all group skew-x-[-4deg]">
                <span className="skew-x-[4deg] flex items-center gap-2">
                  VER CALENDARIO
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
              <button className="bg-f1-black/10 hover:bg-f1-black/20 backdrop-blur-md text-f1-black px-8 py-4 font-bold uppercase tracking-widest flex items-center gap-2 transition-all skew-x-[-4deg]">
                <span className="skew-x-[4deg] flex items-center gap-2">
                  <Play size={18} fill="currentColor" />
                  ÚLTIMOS VIDEOS
                </span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Stats Bar */}
      <div className="absolute bottom-0 left-0 w-full bg-f1-red/90 backdrop-blur-sm py-4">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center overflow-x-auto gap-8 whitespace-nowrap no-scrollbar">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black opacity-70 uppercase tracking-widest">PRÓXIMA CARRERA</span>
            <span className="font-display font-bold italic uppercase">
              {nextRace ? `${nextRace.name} - ${nextRace.date}` : 'TBD'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black opacity-70 uppercase tracking-widest">LÍDER DEL MUNDIAL</span>
            <span className="font-display font-bold italic">
              {leader ? `${leader.name} (${leader.points} PTS)` : 'TBD'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black opacity-70 uppercase tracking-widest">CONSTRUCTORES</span>
            <span className="font-display font-bold italic">
              {constructorsLeader ? `${constructorsLeader.name} (${constructorsLeader.points} PTS)` : 'TBD'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
