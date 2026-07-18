import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Play, Calendar } from 'lucide-react';
import { Video, fetchVideos, fetchSeasons, Season } from '../types';

const Videos = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState<number | 'all'>('all');

  useEffect(() => {
    Promise.all([
      fetchVideos(),
      fetchSeasons()
    ]).then(([videoData, seasonData]) => {
      setVideos(videoData);
      setSeasons(seasonData.sort((a, b) => b.year.localeCompare(a.year)));
      setLoading(false);
    });
  }, []);

  const filteredVideos = selectedSeason === 'all' 
    ? videos 
    : videos.filter(v => v.season_id === selectedSeason);

  const getVideoUrl = (video: Video) => {
    if (!video.youtube_id) return video.url;
    if (video.youtube_id.startsWith('http')) return video.youtube_id;
    return `https://www.youtube.com/watch?v=${video.youtube_id}`;
  };

  if (loading) return <div className="py-24 text-center">Cargando videos...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <h1 className="text-4xl italic font-black tracking-tighter mb-4">
            VIDEOS <span className="text-f1-red">PENTEKARTS</span>
          </h1>
          <p className="text-f1-black/60 max-w-2xl">
            Revive las mejores carreras y momentos de la temporada. Sigue toda la acción de los Grandes Premios.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedSeason('all')}
            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-sm transition-all ${
              selectedSeason === 'all' 
                ? 'bg-f1-red text-white' 
                : 'bg-f1-black/5 text-f1-black/40 hover:bg-f1-black/10'
            }`}
          >
            TODOS
          </button>
          {seasons.map(season => (
            <button
              key={season.id}
              onClick={() => setSelectedSeason(season.id)}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-sm transition-all ${
                selectedSeason === season.id 
                  ? 'bg-f1-red text-white' 
                  : 'bg-f1-black/5 text-f1-black/40 hover:bg-f1-black/10'
              }`}
            >
              TEMPORADA {season.year}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredVideos.map((video, index) => (
          <motion.div
            key={video.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group cursor-pointer"
            onClick={() => window.open(getVideoUrl(video), '_blank')}
          >
            <div className="relative aspect-video overflow-hidden rounded-sm mb-4">
              <img 
                src={video.thumbnail_url || video.thumbnail} 
                alt={video.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-f1-black/20 group-hover:bg-f1-black/40 transition-colors flex items-center justify-center">
                <div className="w-12 h-12 bg-f1-red rounded-full flex items-center justify-center text-white scale-0 group-hover:scale-100 transition-transform duration-300">
                  <Play size={24} fill="currentColor" />
                </div>
              </div>
              <div className="absolute bottom-2 right-2 bg-f1-black text-white text-[10px] font-bold px-2 py-1 rounded-sm">
                {video.date}
              </div>
            </div>
            <h3 className="font-display font-black italic text-lg leading-tight group-hover:text-f1-red transition-colors uppercase">
              {video.title}
            </h3>
            <div className="flex items-center gap-4 mt-2 text-f1-black/40 text-xs font-bold uppercase tracking-widest">
              <span className="flex items-center gap-1">
                <Calendar size={12} /> {video.date}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-24 p-12 bg-f1-black text-white rounded-sm text-center">
        <h2 className="text-3xl italic font-black mb-4 uppercase">¿Quieres ver más?</h2>
        <p className="text-white/60 mb-8 max-w-xl mx-auto">
          Visita nuestro canal oficial de YouTube para ver todas las carreras completas, entrevistas y contenido exclusivo.
        </p>
        <a 
          href="https://www.youtube.com/results?search_query=pentekarts" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-f1-red px-8 py-3 rounded-sm font-black uppercase tracking-widest hover:bg-red-700 transition-colors"
        >
          <Play size={18} fill="currentColor" />
          CANAL DE YOUTUBE
        </a>
      </div>
    </div>
  );
};

export default Videos;
