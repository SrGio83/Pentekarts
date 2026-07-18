import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Trophy, Timer, Award, Flag, MapPin, ChevronRight, Hash } from 'lucide-react';
import { fetchGlobalStatistics } from '../types';

interface StatEntry {
  id: number;
  name: string;
  value: number;
  subtext?: string;
}

const Statistics = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    lapsLed: StatEntry[];
    fastestLaps: StatEntry[];
    racesDisputed: StatEntry[];
    winsByCircuit: StatEntry[];
    polePositions: StatEntry[];
    totalWins: StatEntry[];
    carreraPositions: StatEntry[];
    clasificacionPositions: StatEntry[];
    overtakes: StatEntry[];
  }>({
    lapsLed: [],
    fastestLaps: [],
    racesDisputed: [],
    winsByCircuit: [],
    polePositions: [],
    totalWins: [],
    carreraPositions: [],
    clasificacionPositions: [],
    overtakes: []
  });

  useEffect(() => {
    const loadStats = async () => {
      const data = await fetchGlobalStatistics();
      
      // Process Laps Led
      const lapsLedMap = new Map();
      data.lapsLed.forEach((lap: any) => {
        const driver = lap.drivers;
        const name = `${driver.first_name} ${driver.last_name}`;
        lapsLedMap.set(lap.driver_id, { name, count: (lapsLedMap.get(lap.driver_id)?.count || 0) + 1 });
      });
      const lapsLed = Array.from(lapsLedMap.entries())
        .map(([id, data]) => ({ id, name: data.name, value: data.count }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      // Process Results
      const fastestLapsMap = new Map();
      const racesDisputedMap = new Map();
      const winsByCircuitMap = new Map();
      const polePositionsMap = new Map();
      const totalWinsMap = new Map();
      const carreraPositionsMap = new Map();
      const clasificacionPositionsMap = new Map();
      const overtakesMap = new Map();

      data.results.forEach((res: any) => {
        const driver = res.drivers;
        if (!driver) return;
        const name = `${driver.first_name} ${driver.last_name}`;
        const sessionName = res.race_sessions?.name || '';
        const sessionType = sessionName.startsWith('Carrera') ? 'Carrera' : (sessionName === 'Clasificación' ? 'Clasificación' : 'Otro');

        // Session Positions
        if (sessionType === 'Carrera') {
          const key = `${res.driver_id}_${res.position}`;
          carreraPositionsMap.set(key, {
            driverName: name,
            position: res.position,
            count: (carreraPositionsMap.get(key)?.count || 0) + 1
          });
        } else if (sessionType === 'Clasificación') {
          const key = `${res.driver_id}_${res.position}`;
          clasificacionPositionsMap.set(key, {
            driverName: name,
            position: res.position,
            count: (clasificacionPositionsMap.get(key)?.count || 0) + 1
          });
        }

        // Overtakes
        if (sessionType === 'Carrera' && res.grid_position && res.position) {
          const diff = res.grid_position - res.position;
          if (diff > 0) {
            overtakesMap.set(res.driver_id, {
              name,
              count: (overtakesMap.get(res.driver_id)?.count || 0) + diff
            });
          }
        }

        // Fastest Laps
        if (res.fastest_lap) {
          fastestLapsMap.set(res.driver_id, { name, count: (fastestLapsMap.get(res.driver_id)?.count || 0) + 1 });
        }

        // Races Disputed (only Carrera sessions)
        if (sessionType === 'Carrera') {
          racesDisputedMap.set(res.driver_id, { name, count: (racesDisputedMap.get(res.driver_id)?.count || 0) + 1 });
          
          // Wins
          if (res.position === 1) {
            totalWinsMap.set(res.driver_id, { name, count: (totalWinsMap.get(res.driver_id)?.count || 0) + 1 });
            
            // Wins by Circuit
            const circuit = res.races?.circuits;
            if (circuit) {
              const key = `${res.driver_id}_${circuit.id}`;
              winsByCircuitMap.set(key, { 
                driverName: name, 
                circuitName: circuit.name, 
                count: (winsByCircuitMap.get(key)?.count || 0) + 1 
              });
            }
          }
        }

        // Pole Positions (position 1 in Clasificación)
        if (sessionType === 'Clasificación' && res.position === 1) {
          polePositionsMap.set(res.driver_id, { name, count: (polePositionsMap.get(res.driver_id)?.count || 0) + 1 });
        }
      });

      const fastestLaps = Array.from(fastestLapsMap.entries())
        .map(([id, data]) => ({ id, name: data.name, value: data.count }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      const racesDisputed = Array.from(racesDisputedMap.entries())
        .map(([id, data]) => ({ id, name: data.name, value: data.count }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      const winsByCircuit = Array.from(winsByCircuitMap.values())
        .map((data) => ({ id: 0, name: data.driverName, value: data.count, subtext: data.circuitName }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      const polePositions = Array.from(polePositionsMap.entries())
        .map(([id, data]) => ({ id, name: data.name, value: data.count }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      const totalWins = Array.from(totalWinsMap.entries())
        .map(([id, data]) => ({ id, name: data.name, value: data.count }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      const carreraPositions = Array.from(carreraPositionsMap.values())
        .map((data) => ({ 
          id: 0, 
          name: data.driverName, 
          value: data.count, 
          subtext: `Carrera - P${data.position}` 
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      const clasificacionPositions = Array.from(clasificacionPositionsMap.values())
        .map((data) => ({ 
          id: 0, 
          name: data.driverName, 
          value: data.count, 
          subtext: `Clasificación - P${data.position}` 
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      const overtakes = Array.from(overtakesMap.entries())
        .map(([id, data]) => ({ id, name: data.name, value: data.count }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      setStats({ 
        lapsLed, 
        fastestLaps, 
        racesDisputed, 
        winsByCircuit, 
        polePositions, 
        totalWins, 
        carreraPositions, 
        clasificacionPositions,
        overtakes
      });
      setLoading(false);
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-f1-black/40 font-black uppercase tracking-widest animate-pulse">
          Cargando estadísticas globales...
        </div>
      </div>
    );
  }

  const StatCard = ({ title, icon: Icon, data, unit }: { title: string, icon: any, data: StatEntry[], unit: string }) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-f1-black/5 p-8 rounded-sm border-l-4 border-f1-red"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-f1-red text-white p-2 rounded-sm skew-x-[-12deg]">
          <Icon size={20} className="skew-x-[12deg]" />
        </div>
        <h3 className="text-xl font-f1-bold italic uppercase tracking-tighter">{title}</h3>
      </div>

      <div className="space-y-4">
        {data.map((entry, idx) => (
          <div key={idx} className="flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <span className="text-xs font-black opacity-20 w-4">#{idx + 1}</span>
              <div>
                <p className="text-sm font-f1-bold tracking-tight group-hover:text-f1-red transition-colors">
                  {entry.name}
                </p>
                {entry.subtext && (
                  <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
                    {entry.subtext}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-f1-bold italic text-f1-red">{entry.value}</span>
              <span className="text-[8px] font-black opacity-40 uppercase ml-1">{unit}</span>
            </div>
          </div>
        ))}
        {data.length === 0 && (
          <p className="text-xs font-bold opacity-40 uppercase italic py-4">Sin datos disponibles</p>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="bg-white min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-16">
          <h1 className="text-6xl md:text-8xl font-f1-wide font-black italic uppercase leading-none mb-4">
            HALL OF <span className="text-f1-red">FAME</span>
          </h1>
          <p className="text-f1-black/60 font-bold uppercase tracking-widest max-w-2xl">
            Consulta los récords históricos y las estadísticas más destacadas de nuestro campeonato. 
            Desde vueltas lideradas hasta victorias en circuitos específicos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <StatCard 
            title="Victorias Totales" 
            icon={Trophy} 
            data={stats.totalWins} 
            unit="WINS" 
          />
          <StatCard 
            title="Pole Positions" 
            icon={Award} 
            data={stats.polePositions} 
            unit="POLES" 
          />
          <StatCard 
            title="Vueltas Lideradas" 
            icon={Flag} 
            data={stats.lapsLed} 
            unit="VUELTAS" 
          />
          <StatCard 
            title="Vueltas Rápidas" 
            icon={Timer} 
            data={stats.fastestLaps} 
            unit="V. RÁPIDAS" 
          />
          <StatCard 
            title="Carreras Disputadas" 
            icon={Hash} 
            data={stats.racesDisputed} 
            unit="CARRERAS" 
          />
          <StatCard 
            title="Victorias por Circuito" 
            icon={MapPin} 
            data={stats.winsByCircuit} 
            unit="WINS" 
          />
          <StatCard 
            title="Posiciones en Carrera" 
            icon={Award} 
            data={stats.carreraPositions} 
            unit="VECES" 
          />
          <StatCard 
            title="Posiciones en Clasificación" 
            icon={Award} 
            data={stats.clasificacionPositions} 
            unit="VECES" 
          />
          <StatCard 
            title="Adelantamientos" 
            icon={ChevronRight} 
            data={stats.overtakes} 
            unit="POSICIONES" 
          />
        </div>
      </div>
    </div>
  );
};

export default Statistics;
