
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { saveRaceResults, fetchDrivers, RaceResult, RaceSession, fetchSessions } from '../types';
import { RefreshCw, FileText, CheckCircle, AlertCircle, Upload, List } from 'lucide-react';

const RaceResultsProcessor = ({ raceId }: { raceId: number }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [sessions, setSessions] = useState<RaceSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | ''>('');

  useEffect(() => {
    const loadSessions = async () => {
      const data = await fetchSessions(raceId);
      setSessions(data);
      if (data.length > 0) {
        setSelectedSessionId(data[0].id);
      }
    };
    loadSessions();
  }, [raceId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const processResults = async () => {
    if (!file) {
      setError('Por favor, selecciona un archivo PDF.');
      return;
    }

    if (selectedSessionId === '') {
      setError('Por favor, selecciona una sesión.');
      return;
    }

    setLoading(true);
    setError(null);
    setStatus('Subiendo y extrayendo texto del PDF...');

    try {
      // 1. Extract text from PDF using our backend
      const formData = new FormData();
      formData.append('pdf', file);

      const extractResponse = await fetch('/api/process-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!extractResponse.ok) {
        throw new Error('Error al procesar el PDF en el servidor.');
      }

      const { text: pdfText } = await extractResponse.json();

      setStatus('Interpretando datos con Gemini...');
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      
      const sessionName = sessions.find(s => s.id === selectedSessionId)?.name || 'Carrera';

      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [
          {
            parts: [
              { text: `Extract the race results for the session "${sessionName}" from this text extracted from a PDF.
              The text contains timing sheets and classification for a karting race.
              Look for the final classification or race results for this specific session.
              
              Text content:
              ${pdfText}

              Return a JSON array of objects with these exact fields:
              - driver_name: string (Full name of the driver)
              - position: number (Final finishing position)
              - grid_position: number (Starting position on the grid, if available)
              - points_earned: number (Points awarded for this race)
              - time_gap: string (Time gap to the leader, e.g., "+5.234" or "10 Laps")
              - fastest_lap: boolean (True if this driver set the fastest lap of the race)
              - status: string (e.g., "Finished", "DNF", "DSQ")
              - best_lap: string (The best lap time of the driver in this session, e.g., "1:02.345")
              - kart_number: string (The number of the kart used by the driver, e.g., "14")
              
              Important: If a driver appears multiple times, ensure their final position for this session is correctly captured.` }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                driver_name: { type: Type.STRING },
                position: { type: Type.INTEGER },
                grid_position: { type: Type.INTEGER },
                points_earned: { type: Type.INTEGER },
                time_gap: { type: Type.STRING },
                fastest_lap: { type: Type.BOOLEAN },
                status: { type: Type.STRING },
                best_lap: { type: Type.STRING },
                kart_number: { type: Type.STRING }
              },
              required: ["driver_name", "position", "points_earned"]
            }
          }
        }
      });

      const extractedData = JSON.parse(response.text);
      
      // Validar datos extraídos
      const validData = extractedData.filter((res: any) => {
        const isNameValid = typeof res.driver_name === 'string' && res.driver_name.trim().length > 0;
        const isPositionValid = typeof res.position === 'number' && !isNaN(res.position) && res.position > 0;
        const isPointsValid = typeof res.points_earned === 'number' && !isNaN(res.points_earned) && res.points_earned >= 0;
        
        if (!isNameValid || !isPositionValid || !isPointsValid) {
          console.warn('Datos inválidos detectados y omitidos:', res);
          return false;
        }
        return true;
      });

      setResults(validData);
      setStatus(`Se han extraído ${validData.length} resultados válidos. Mapeando pilotos...`);

      const allDrivers = await fetchDrivers('all');
      
      const mappedResults: RaceResult[] = validData.map((res: any) => {
        const driver = allDrivers.find(d => 
          d.name.toLowerCase().includes(res.driver_name.toLowerCase()) || 
          res.driver_name.toLowerCase().includes(d.name.toLowerCase())
        );

        return {
          race_id: raceId,
          session_id: Number(selectedSessionId),
          driver_id: driver ? driver.id : 0,
          position: res.position,
          grid_position: res.grid_position,
          points_earned: res.points_earned,
          time_gap: res.time_gap,
          fastest_lap: res.fastest_lap,
          status: res.status,
          best_lap: res.best_lap,
          kart_number: res.kart_number
        };
      }).filter((r: RaceResult) => r.driver_id !== 0);

      setStatus(`Guardando ${mappedResults.length} resultados en la base de datos...`);
      await saveRaceResults(mappedResults);
      
      setStatus('¡Procesamiento completado con éxito!');
    } catch (err: any) {
      console.error('Error processing results:', err);
      setError(err.message || 'Error desconocido al procesar los resultados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-sm border border-f1-black/10">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="text-f1-red" />
        <h3 className="text-xl font-display font-black italic uppercase">Procesador de Resultados PDF</h3>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">Seleccionar Sesión</label>
          <div className="flex gap-2">
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(Number(e.target.value))}
              className="flex-grow bg-white border border-f1-black/10 px-3 py-2 text-sm rounded-sm outline-none focus:border-f1-red"
            >
              <option value="">Seleccionar sesión...</option>
              {sessions.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <button 
              onClick={async () => {
                const data = await fetchSessions(raceId);
                setSessions(data);
              }}
              className="p-2 bg-f1-black/5 rounded-sm hover:bg-f1-red hover:text-white transition-all"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">Subir PDF de Resultados</label>
          <div className="relative">
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
              id="pdf-upload"
            />
            <label
              htmlFor="pdf-upload"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-f1-black/10 rounded-sm cursor-pointer hover:border-f1-red transition-all"
            >
              <Upload className="text-f1-black/20 mb-2" size={32} />
              <span className="text-xs font-bold uppercase tracking-widest text-f1-black/40">
                {file ? file.name : 'Haz clic para seleccionar un PDF'}
              </span>
            </label>
          </div>
        </div>

        <button
          onClick={processResults}
          disabled={loading || !file || !selectedSessionId}
          className="w-full flex items-center justify-center gap-2 bg-f1-red text-white py-3 px-6 rounded-sm font-black uppercase tracking-widest hover:bg-f1-red/90 transition-all disabled:opacity-50"
        >
          {loading ? <RefreshCw className="animate-spin" size={18} /> : <FileText size={18} />}
          {loading ? 'Procesando...' : 'Procesar Resultados'}
        </button>

        {status && (
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-f1-black/40">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            {status}
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 p-4 bg-red-50 text-red-600 rounded-sm text-xs">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {results.length > 0 && !loading && (
          <div className="mt-6">
            <h4 className="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
              <CheckCircle size={14} className="text-green-500" /> Vista previa de datos extraídos
            </h4>
            <div className="max-h-60 overflow-y-auto border border-f1-black/5 rounded-sm">
              <table className="w-full text-[10px] text-left">
                <thead className="sticky top-0 bg-f1-black/5 font-black uppercase">
                  <tr>
                    <th className="p-2">Pos</th>
                    <th className="p-2">Piloto</th>
                    <th className="p-2">Kart</th>
                    <th className="p-2">Mejor Vuelta</th>
                    <th className="p-2">Puntos</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((res, idx) => (
                    <tr key={idx} className="border-t border-f1-black/5">
                      <td className="p-2 font-bold italic">#{res.position}</td>
                      <td className="p-2 uppercase">{res.driver_name}</td>
                      <td className="p-2">#{res.kart_number || '-'}</td>
                      <td className="p-2 font-mono">{res.best_lap || '-'}</td>
                      <td className="p-2">{res.points_earned}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RaceResultsProcessor;
