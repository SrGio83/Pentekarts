import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { FileText, Shield, Flag, Award, LucideIcon } from 'lucide-react';
import { fetchReglamento, Reglamento as ReglamentoType } from '../types';

const iconMap: Record<string, LucideIcon> = {
  Award,
  Flag,
  Shield,
  FileText
};

const Reglamento = () => {
  const [sections, setSections] = useState<ReglamentoType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReglamento().then(data => {
      setSections(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <p className="text-f1-black/40 font-black uppercase tracking-widest animate-pulse">Cargando reglamento...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 py-24"
    >
      <div className="mb-16">
        <h1 className="text-5xl italic font-black tracking-tighter mb-6">
          REGLAMENTO <span className="text-f1-red">OFICIAL</span>
        </h1>
        <p className="text-f1-black/60 max-w-3xl text-lg font-medium">
          Normativa vigente para la temporada de Pentekarts. Todos los pilotos deben conocer y cumplir estas reglas para garantizar una competición justa y emocionante.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {sections.map((section, idx) => {
          const Icon = iconMap[section.icon] || FileText;
          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-8 border-l-4 border-f1-red shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-f1-red/10 rounded-full flex items-center justify-center text-f1-red">
                  <Icon size={24} />
                </div>
                <h2 className="text-xl font-black italic tracking-tight">{section.title}</h2>
              </div>
              <ul className="space-y-3">
                {section.content.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-f1-black/70 font-medium">
                    <span className="w-1.5 h-1.5 bg-f1-red rounded-full mt-2 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-20 p-12 bg-f1-black text-white rounded-sm skew-x-[-2deg]">
        <div className="skew-x-[2deg]">
          <h3 className="text-2xl font-black italic mb-4">¿TIENES DUDAS?</h3>
          <p className="text-white/60 mb-8 max-w-2xl">
            Si tienes alguna pregunta sobre la interpretación del reglamento o quieres reportar un incidente, contacta con la dirección de carrera a través de los canales oficiales.
          </p>
          <button className="bg-f1-red text-white px-8 py-3 text-xs font-black uppercase tracking-widest hover:bg-white hover:text-f1-red transition-all">
            CONTACTAR COMISARIOS
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default Reglamento;
