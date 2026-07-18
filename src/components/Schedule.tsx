import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Race, Season, fetchRaces, fetchSeasons } from '../types';
import { MapPin, Calendar as CalendarIcon, ChevronRight, CheckCircle2 } from 'lucide-react';

const Schedule = () => {
  const [races, setRaces] = useState<Race[]>([]);
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
    fetchRaces(selectedSeason).then(data => {
      setRaces(data);
      setLoading(false);
    });
  }, [selectedSeason]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <h2 className="text-4xl md:text-6xl italic leading-none mb-4 uppercase text-f1-black">
            CALENDARIO <br /><span className="text-f1-red">{selectedSeason}</span>
          </h2>
          <p className="text-f1-black/60 font-medium max-w-md">
            Sigue el recorrido del campeonato por los mejores circuitos de la Comunidad Valenciana.
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
        <div className="py-24 text-center text-f1-black/40 font-bold uppercase tracking-widest">Cargando calendario...</div>
      ) : races.length === 0 ? (
        <div className="py-24 text-center text-f1-black/40 font-bold uppercase tracking-widest border border-dashed border-f1-black/10 rounded-sm">
          No hay carreras programadas para la temporada {selectedSeason}
        </div>
      ) : (
        <div className="space-y-4">
        {races.map((race, index) => (
          <motion.div
            key={`${race.id}-${index}`}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            viewport={{ once: true }}
            className={`flex flex-col md:flex-row items-center gap-6 p-6 rounded-sm border-l-4 transition-all ${
              race.status === 'completed' 
                ? 'bg-f1-black/5 border-f1-black/20 opacity-60' 
                : 'bg-white border-f1-red hover:bg-f1-black/5 shadow-md'
            }`}
          >
            <div className="flex-shrink-0 w-24 text-center">
              <span className="block text-3xl font-display font-black italic text-f1-black">{index + 1}</span>
              <span className="text-[10px] font-black opacity-40 uppercase tracking-widest text-f1-black">RONDA</span>
            </div>

            <div className="flex-grow">
              <div className="flex items-center gap-2 mb-1">
                <Link to={`/carrera/${race.id}`} className="text-xl font-display font-bold italic text-f1-black hover:text-f1-red transition-colors">
                  {race.name}
                </Link>
                {race.status === 'completed' && <CheckCircle2 size={16} className="text-green-600" />}
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-f1-black/60 font-medium">
                <div className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-f1-red" />
                  {race.location}
                </div>
                <div className="flex items-center gap-1.5">
                  <CalendarIcon size={14} className="text-f1-red" />
                  {race.date}
                </div>
              </div>
            </div>

            <div className="flex-shrink-0">
              <Link 
                to={`/carrera/${race.id}`}
                className={`px-6 py-2 text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                  race.status === 'upcoming'
                    ? 'bg-f1-black text-white hover:bg-f1-red'
                    : 'border border-f1-black/20 text-f1-black/60 hover:bg-f1-black/10'
                }`}
              >
                {race.status === 'upcoming' ? 'DETALLES' : 'RESULTADOS'}
                <ChevronRight size={14} />
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
      )}
    </div>
  );
};

export default Schedule;
