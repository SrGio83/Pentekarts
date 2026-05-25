import { supabase } from './supabaseClient';

export interface Season {
  id: number;
  year: string;
  name?: string;
}

export interface Driver {
  id: number;
  name: string;
  teamId: number;
  points: number;
  rank: number;
  image?: string;
  seasonId?: number;
  seasonYear?: string;
  team?: {
    id: number;
    name: string;
    color: string;
    logo?: string;
  };
}

export interface Team {
  id: number;
  name: string;
  points: number;
  rank: number;
  color: string;
  logo?: string;
  seasonId?: number;
  seasonYear?: string;
}

export interface Race {
  id: number;
  name: string;
  short_name?: string;
  location: string;
  date: string;
  status: 'upcoming' | 'completed';
  trackMap?: string;
  description?: string;
  officialWeb?: string;
  seasonId?: number;
  seasonYear?: string;
  rawDate?: string;
  circuit_id?: number;
  circuit_details?: {
    length_m?: number;
    turns?: number;
    lap_record?: string;
    circuit_type?: string;
  };
}

export interface RaceSession {
  id: number;
  race_id: number;
  name: string;
  order: number;
  session_pdf?: { url_pdf: string }[];
}

export interface Video {
  id: number;
  title: string;
  thumbnail: string;
  url: string;
  date: string;
  category?: string;
  season_id?: number;
  session_id?: number;
  youtube_id?: string;
  thumbnail_url?: string;
}

export interface Reglamento {
  id: number;
  title: string;
  icon: string;
  content: string[];
}

export interface Game {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  players: string;
  difficulty: string;
  button_text?: string;
  game_url?: string;
}

export const fetchSeasons = async (): Promise<Season[]> => {
  const { data, error } = await supabase.from('seasons').select('*').order('year', { ascending: true });
  if (error) {
    console.error('Error fetching seasons:', error);
    return [];
  }
  return data || [];
};

export const fetchDriverById = async (id: number): Promise<Driver | null> => {
  // 1. Fetch base driver info
  const { data: driverBase, error: baseError } = await supabase
    .from('drivers')
    .select('*')
    .eq('id', id)
    .single();

  if (baseError || !driverBase) {
    console.error('Error fetching base driver:', baseError);
    return null;
  }

  // 2. Fetch all season-specific entries for this driver
  const { data: seasonEntries, error: seasonError } = await supabase
    .from('season_drivers')
    .select(`
      *,
      seasons (
        year
      ),
      teams (
        id,
        name,
        color_hex,
        logo_url
      )
    `)
    .eq('driver_id', id)
    .order('season_id', { ascending: false });

  if (seasonError) {
    console.error('Error fetching season entries:', seasonError);
    return null;
  }

  // Use the most recent season entry for the main driver object
  const sortedEntries = (seasonEntries || []).sort((a, b) => {
    const yearA = parseInt(a.seasons?.year || '0');
    const yearB = parseInt(b.seasons?.year || '0');
    return yearB - yearA;
  });
  const latestEntry = sortedEntries[0];

  return {
    id: driverBase.id,
    name: `${driverBase.first_name} ${driverBase.last_name || ''}`.trim(),
    teamId: latestEntry ? Number(latestEntry.team_id) : 0,
    points: latestEntry ? latestEntry.points : 0,
    rank: latestEntry ? latestEntry.rank : 0,
    image: driverBase.image_url || latestEntry?.image_url,
    seasonId: latestEntry ? latestEntry.season_id : undefined,
    seasonYear: latestEntry?.seasons?.year,
    team: latestEntry?.teams ? {
      id: Number(latestEntry.team_id),
      name: latestEntry.teams.name,
      color: latestEntry.teams.color_hex || '#FF1801',
      logo: latestEntry.teams.logo_url
    } : undefined,
    // We could add a history field here if needed, but for now we'll just return the latest
  };
};

export const fetchDriverHistory = async (id: number) => {
  const { data, error } = await supabase
    .from('season_drivers')
    .select(`
      *,
      seasons (
        year
      ),
      teams (
        id,
        name,
        color_hex,
        logo_url
      )
    `)
    .eq('driver_id', id)
    .order('season_id', { ascending: false });

  if (error) {
    console.error('Error fetching driver history:', error);
    return [];
  }

  const sortedData = (data || []).sort((a, b) => {
    const yearA = parseInt(a.seasons?.year || '0');
    const yearB = parseInt(b.seasons?.year || '0');
    return yearB - yearA;
  });

  return sortedData.map(entry => ({
    seasonYear: entry.seasons?.year,
    teamName: entry.teams?.name,
    teamColor: entry.teams?.color_hex,
    teamLogo: entry.teams?.logo_url,
    points: entry.points,
    rank: entry.rank
  }));
};

export const fetchTeams = async (seasonYear?: string): Promise<Team[]> => {
  console.log('Fetching teams for season year:', seasonYear);
  
  // 1. Get the season ID for the given year
  let seasonId: number | undefined;
  if (seasonYear && seasonYear !== 'all') {
    const { data: seasonData } = await supabase.from('seasons').select('id').eq('year', seasonYear).single();
    seasonId = seasonData?.id;
  }

  // 2. Fetch season-specific team data
  let query = supabase.from('season_teams').select(`
    *,
    teams (
      name,
      logo_url,
      color_hex
    ),
    seasons (
      year
    )
  `);
  
  if (seasonId) {
    query = query.eq('season_id', seasonId);
  }

  const { data: seasonTeamsData, error: teamsError } = await query;
  
  if (teamsError) {
    console.error('Error fetching teams:', teamsError);
    return [];
  }

  // 3. Fetch all drivers for this season to calculate team points (if not already in season_teams)
  const teams = (seasonTeamsData || []).map((st: any) => ({
    id: Number(st.team_id || 0),
    name: st.teams?.name || 'Equipo Desconocido',
    points: st.points || 0,
    rank: st.rank || 0,
    color: st.teams?.color_hex || st.color_hex || '#FF1801',
    logo: st.logo_url || st.teams?.logo_url,
    seasonId: st.season_id || 0,
    seasonYear: st.seasons?.year
  }));

  return teams.sort((a, b) => b.points - a.points).map((t, index) => ({
    ...t,
    rank: index + 1
  }));
};

export const fetchDrivers = async (seasonYear?: string): Promise<Driver[]> => {
  // 1. Get the season ID for the given year
  let seasonId: number | undefined;
  if (seasonYear && seasonYear !== 'all') {
    const { data: seasonData } = await supabase.from('seasons').select('id').eq('year', seasonYear).single();
    seasonId = seasonData?.id;
  }

  // 2. Fetch season-specific driver data
  let query = supabase.from('season_drivers').select(`
    *,
    drivers (
      first_name,
      last_name,
      image_url
    ),
    seasons (
      year
    ),
    teams (
      name,
      color_hex,
      logo_url
    )
  `);
  
  if (seasonId) {
    query = query.eq('season_id', seasonId);
  }

  const { data, error } = await query.order('points', { ascending: false });
  
  if (error) {
    console.error('Error fetching drivers:', error);
    return [];
  }
  
  return (data || []).map((sd: any, index: number) => ({
    id: Number(sd.driver_id || 0),
    name: `${sd.drivers?.first_name || ''} ${sd.drivers?.last_name || ''}`.trim() || 'Piloto Desconocido',
    teamId: Number(sd.team_id || 0),
    points: sd.points || 0,
    rank: sd.rank || index + 1,
    image: sd.drivers?.image_url || sd.image_url,
    seasonId: sd.season_id || 0,
    seasonYear: sd.seasons?.year,
    team: sd.teams ? {
      id: Number(sd.team_id),
      name: sd.teams.name,
      color: sd.teams.color_hex || '#FF1801',
      logo: sd.teams.logo_url
    } : undefined
  }));
};

export const fetchRaces = async (seasonYear?: string): Promise<Race[]> => {
  // 1. Get the season ID for the given year
  let seasonId: number | undefined;
  if (seasonYear && seasonYear !== 'all') {
    const { data: seasonData } = await supabase.from('seasons').select('id').eq('year', seasonYear).single();
    seasonId = seasonData?.id;
  }

  // 2. Fetch season-specific race data
  let query = supabase.from('season_races').select(`
    *,
    races (
      name,
      location,
      description,
      official_web,
      circuits (
        id,
        map_image_url
      )
    ),
    seasons (
      year
    )
  `);
  
  if (seasonId) {
    query = query.eq('season_id', seasonId);
  }

  const { data, error } = await query.order('race_date', { ascending: true });
  
  if (error) {
    console.error('Error fetching races:', error);
    return [];
  }
  
  return (data || []).map((sr: any) => ({
    id: Number(sr.race_id || 0),
    name: sr.races?.name || 'Carrera Desconocida',
    location: sr.races?.location || 'TBD',
    date: sr.race_date ? new Date(sr.race_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBD',
    status: sr.status === 'completed' ? 'completed' : 'upcoming',
    trackMap: sr.races?.circuits?.map_image_url || sr.track_map_url,
    description: sr.races?.description,
    officialWeb: sr.races?.official_web,
    seasonId: sr.season_id || 0,
    seasonYear: sr.seasons?.year,
    rawDate: sr.race_date,
    circuit_id: sr.races?.circuits?.id
  }));
};

export const fetchCircuitDetails = async (circuitId: number) => {
  const { data, error } = await supabase
    .from('circuits')
    .select('length_m, turns, lap_record, circuit_type')
    .eq('id', circuitId)
    .single();

  if (error) {
    console.error('Error fetching circuit details:', error);
    return null;
  }
  return data;
};

export const fetchVideos = async (seasonId?: number): Promise<Video[]> => {
  let query = supabase
    .from('videos')
    .select('*');
  
  if (seasonId) {
    query = query.eq('season_id', seasonId);
  }

  const { data, error } = await query.order('date', { ascending: false });
  
  if (error) {
    console.error('Error fetching videos:', error);
    return [];
  }
  return data || [];
};

export const fetchCircuitBestLaps = async (circuitId: number) => {
  try {
    const { data, error } = await supabase
      .from('race_results')
      .select(`
        best_lap,
        kart_number,
        position,
        fastest_lap,
        drivers (first_name, last_name),
        race_sessions!inner (
          name,
          races!inner (
            circuit_id,
            season_races!inner (
              seasons (year)
            )
          )
        )
      `)
      .eq('race_sessions.races.circuit_id', circuitId)
      .not('best_lap', 'is', null);

    if (error) {
      console.warn('Error fetching circuit best laps:', error);
      return { raceBestLaps: [], qualyBestLaps: [] };
    }

    const process = (item: any) => ({
      driver: item.drivers ? `${item.drivers.first_name} ${item.drivers.last_name}` : 'Piloto Desconocido',
      time: item.best_lap,
      year: item.race_sessions?.races?.season_races?.[0]?.seasons?.year || 'TBD',
      kart: item.kart_number
    });

    // Fastest lap in Carrera (ilike 'Carrera%')
    const raceBestLaps = (data || [])
      .filter((r: any) => r.race_sessions?.name?.toLowerCase().startsWith('carrera') && r.fastest_lap === true)
      .map(process)
      .sort((a, b) => (b.year || '').localeCompare(a.year || ''));

    // Pole position in Clasificación (position = 1)
    const qualyBestLaps = (data || [])
      .filter((r: any) => r.race_sessions?.name === 'Clasificación' && r.position === 1)
      .map(process)
      .sort((a, b) => (b.year || '').localeCompare(a.year || ''));

    return { raceBestLaps, qualyBestLaps };
  } catch (err) {
    console.warn('Exception in fetchCircuitBestLaps:', err);
    return { raceBestLaps: [], qualyBestLaps: [] };
  }
};

export const fetchVideosBySession = async (sessionId: number): Promise<Video[]> => {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('session_id', sessionId);
  
  if (error) {
    console.error('Error fetching videos by session:', error);
    return [];
  }
  return data || [];
};

export const updateDriver = async (id: number, data: Partial<Driver>) => {
  // 1. Update base driver info
  const { error: baseError } = await supabase
    .from('drivers')
    .update({
      first_name: data.name?.split(' ')[0],
      last_name: data.name?.split(' ').slice(1).join(' '),
      image_url: data.image
    })
    .eq('id', id);
  
  if (baseError) throw baseError;

  // 2. Update season-specific info if seasonId is provided
  if (data.seasonId) {
    const { error: seasonError } = await supabase
      .from('season_drivers')
      .update({
        points: data.points,
        rank: data.rank,
        team_id: data.teamId,
        image_url: data.image
      })
      .eq('driver_id', id)
      .eq('season_id', data.seasonId);
    
    if (seasonError) throw seasonError;
  }
};

export const updateTeam = async (id: number, data: Partial<Team>) => {
  // 1. Update base team info
  const { error: baseError } = await supabase
    .from('teams')
    .update({
      name: data.name
    })
    .eq('id', id);
  
  if (baseError) throw baseError;

  // 2. Update season-specific info if seasonId is provided
  if (data.seasonId) {
    const { error: seasonError } = await supabase
      .from('season_teams')
      .update({
        points: data.points,
        rank: data.rank,
        color_hex: data.color,
        logo_url: data.logo
      })
      .eq('team_id', id)
      .eq('season_id', data.seasonId);
    
    if (seasonError) throw seasonError;
  }
};

export const updateRace = async (id: number, data: Partial<Race>) => {
  // 1. Update base race info
  const { error: baseError } = await supabase
    .from('races')
    .update({
      name: data.name,
      location: data.location,
      description: data.description,
      official_web: data.officialWeb
    })
    .eq('id', id);
  
  if (baseError) throw baseError;

  // 2. Update season-specific info if seasonId is provided
  if (data.seasonId) {
    const { error: seasonError } = await supabase
      .from('season_races')
      .update({
        status: data.status,
        track_map_url: data.trackMap
      })
      .eq('race_id', id)
      .eq('season_id', data.seasonId);
    
    if (seasonError) throw seasonError;
  }
};

export const createDriver = async (data: Omit<Driver, 'id'>) => {
  // 1. Create base driver (let DB generate ID if not provided, but here we expect it to be auto-increment)
  const { data: driverData, error: baseError } = await supabase
    .from('drivers')
    .insert([{
      first_name: data.name.split(' ')[0],
      last_name: data.name.split(' ').slice(1).join(' '),
      image_url: data.image
    }])
    .select()
    .single();
  
  if (baseError) throw baseError;

  const driverId = driverData.id;

  // 2. Create season-specific entry
  if (data.seasonId) {
    const { error: seasonError } = await supabase
      .from('season_drivers')
      .insert([{
        driver_id: driverId,
        season_id: data.seasonId,
        team_id: data.teamId,
        points: data.points,
        rank: data.rank,
        image_url: data.image
      }]);
    
    if (seasonError) throw seasonError;
  }
};

export const createTeam = async (data: Omit<Team, 'id'>) => {
  // 1. Create base team
  const { data: teamData, error: baseError } = await supabase
    .from('teams')
    .insert([{
      name: data.name
    }])
    .select()
    .single();
  
  if (baseError) throw baseError;

  const teamId = teamData.id;

  // 2. Create season-specific entry
  if (data.seasonId) {
    const { error: seasonError } = await supabase
      .from('season_teams')
      .insert([{
        team_id: teamId,
        season_id: data.seasonId,
        points: data.points,
        rank: data.rank,
        color_hex: data.color,
        logo_url: data.logo
      }]);
    
    if (seasonError) throw seasonError;
  }
};

export const createRace = async (data: Omit<Race, 'id'>) => {
  // 1. Create base race
  const { data: raceData, error: baseError } = await supabase
    .from('races')
    .insert([{
      name: data.name,
      location: data.location,
      description: data.description,
      official_web: data.officialWeb
    }])
    .select()
    .single();
  
  if (baseError) throw baseError;

  const raceId = raceData.id;

  // 2. Create season-specific entry
  if (data.seasonId) {
    const { error: seasonError } = await supabase
      .from('season_races')
      .insert([{
        race_id: raceId,
        season_id: data.seasonId,
        status: data.status,
        track_map_url: data.trackMap,
        race_date: new Date().toISOString()
      }]);
    
    if (seasonError) throw seasonError;
  }
};

export const updateVideo = async (id: number, data: Partial<Video>) => {
  const { error } = await supabase
    .from('videos')
    .update(data)
    .eq('id', id);
  
  if (error) throw error;
};

export const createVideo = async (data: Omit<Video, 'id'>) => {
  const { error } = await supabase
    .from('videos')
    .insert([data]);
  
  if (error) throw error;
};

export const fetchReglamento = async (): Promise<Reglamento[]> => {
  const { data, error } = await supabase
    .from('reglamento')
    .select('*')
    .order('id', { ascending: true });
  
  if (error) {
    console.error('Error fetching reglamento:', error);
    return [];
  }
  return data || [];
};

export const updateReglamento = async (id: number, data: Partial<Reglamento>) => {
  const { error } = await supabase
    .from('reglamento')
    .update(data)
    .eq('id', id);
  
  if (error) throw error;
};

export const createReglamento = async (data: Omit<Reglamento, 'id'>) => {
  const { error } = await supabase
    .from('reglamento')
    .insert([data]);
  
  if (error) throw error;
};

export const deleteReglamento = async (id: number) => {
  const { error } = await supabase
    .from('reglamento')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

export const fetchGames = async (): Promise<Game[]> => {
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .order('id', { ascending: true });
  
  if (error) {
    console.error('Error fetching games:', error);
    return [];
  }
  return data || [];
};

export const fetchGlobalStatistics = async () => {
  // 1. Laps Led
  const { data: lapsLedData, error: lapsError } = await supabase
    .from('session_laps')
    .select('driver_id, drivers(first_name, last_name)')
    .eq('lap_position', 1);

  // 2. Session Positions & Fastest Laps & Races Disputed & Overtakes
  const { data: resultsData, error: resultsError } = await supabase
    .from('race_results')
    .select(`
      driver_id,
      position,
      grid_position,
      fastest_lap,
      drivers(first_name, last_name),
      race_sessions(name),
      races(id, name, circuits(id, name))
    `);

  if (lapsError || resultsError) {
    console.error('Error fetching global stats:', lapsError || resultsError);
  }

  return {
    lapsLed: lapsLedData || [],
    results: resultsData || []
  };
};

export const fetchLatestRace = async (seasonYear: string): Promise<Race | null> => {
  const races = await fetchRaces(seasonYear);
  // The user wants the first race that is NOT 'completed'
  const upcoming = races.filter(r => r.status !== 'completed');
  return upcoming.length > 0 ? upcoming[0] : (races.length > 0 ? races[races.length - 1] : null);
};

export interface SiteSettings {
  id: number;
  hero_title: string;
  hero_subtitle: string;
  hero_image_url?: string;
}

export const fetchSiteSettings = async (): Promise<SiteSettings> => {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .maybeSingle();
  
  if (error || !data) {
    return { 
      id: 1, 
      hero_title: 'EL FUTURO DEL KARTING', 
      hero_subtitle: 'EL CAMPEONATO OFICIAL DE KARTING INSPIRADO EN LA FÓRMULA 1',
      hero_image_url: 'https://pentekarts.web.app/images/circuits/fondo-Dakart.png'
    };
  }
  return data;
};

export const updateSiteSettings = async (settings: Partial<SiteSettings>) => {
  const { data, error } = await supabase
    .from('site_settings')
    .upsert({ id: 1, ...settings })
    .select()
    .single();
  
  if (error) {
    console.error('Error updating site settings:', error);
    throw error;
  }
  return data;
};

export const fetchDriverStats = async (driverId: number) => {
  // 1. Fetch all results for "Carrera" sessions
  const { data: results, error: resultsError } = await supabase
    .from('race_results')
    .select(`
      position,
      fastest_lap,
      race_sessions!inner (
        name
      )
    `)
    .eq('driver_id', driverId)
    .ilike('race_sessions.name', 'Carrera%');

  if (resultsError) {
    console.error('Error fetching driver stats:', resultsError);
  }

  const carreraResults = results || [];

  // 2. Count poles (position 1 in "Clasificación" sessions)
  const { data: polesResults, error: polesError } = await supabase
    .from('race_results')
    .select(`
      position,
      race_sessions!inner (
        name
      )
    `)
    .eq('driver_id', driverId)
    .eq('position', 1)
    .eq('race_sessions.name', 'Clasificación');

  if (polesError) {
    console.error('Error fetching poles:', polesError);
  }

  const poles = polesResults?.length || 0;

  // 3. Count laps led
  const { count: lapsLed, error: lapsError } = await supabase
    .from('session_laps')
    .select('*', { count: 'exact', head: true })
    .eq('driver_id', driverId)
    .eq('lap_position', 1);

  if (lapsError) {
    console.error('Error fetching laps led:', lapsError);
  }

  const positions = carreraResults.map(r => r.position).filter(p => p > 0);
  const bestPosition = positions.length > 0 ? Math.min(...positions) : 0;
  const fastestLaps = carreraResults.filter(r => r.fastest_lap === true).length;

  return {
    racesDisputed: carreraResults.length,
    wins: carreraResults.filter(r => r.position === 1).length,
    podiums: carreraResults.filter(r => r.position >= 1 && r.position <= 3).length,
    poles,
    lapsLed: lapsLed || 0,
    fastestLaps,
    bestPosition
  };
};

export interface RaceResult {
  id?: number;
  race_id: number;
  session_id?: number;
  driver_id: number;
  position: number;
  grid_position?: number;
  points_earned: number;
  time_gap?: string;
  fastest_lap?: boolean;
  status?: string;
  best_lap?: string;
  kart_number?: string;
}

export interface SessionLap {
  id: number;
  session_id: number;
  driver_id: number;
  lap_number: number;
  lap_time: string;
  lap_position: number;
}

export const saveRaceResults = async (results: RaceResult[]) => {
  const { error } = await supabase
    .from('race_results')
    .insert(results);
  
  if (error) throw error;
};

export const fetchRaceResults = async (raceId: number, sessionId?: number): Promise<RaceResult[]> => {
  let query = supabase
    .from('race_results')
    .select(`
      *,
      drivers (
        id,
        first_name,
        last_name,
        image_url
      )
    `)
    .eq('race_id', raceId);
  
  if (sessionId) {
    query = query.eq('session_id', sessionId);
  }

  const { data, error } = await query.order('position', { ascending: true });
  
  if (error) {
    console.error('Error fetching race results:', error);
    return [];
  }
  return data || [];
};

export const fetchSessions = async (raceId: number): Promise<RaceSession[]> => {
  const { data, error } = await supabase
    .from('race_sessions')
    .select(`
      *,
      session_pdf (
        url_pdf
      )
    `)
    .eq('race_id', raceId)
    .order('order', { ascending: true });
  
  if (error) {
    console.error('Error fetching sessions:', error);
    return [];
  }
  return data || [];
};

export const createSession = async (session: Omit<RaceSession, 'id'>) => {
  const { data, error } = await supabase
    .from('race_sessions')
    .insert([session])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteSession = async (id: number) => {
  const { error } = await supabase
    .from('race_sessions')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

export const fetchSessionLaps = async (sessionId: number, driverId?: number): Promise<SessionLap[]> => {
  let query = supabase
    .from('session_laps')
    .select('*')
    .eq('session_id', sessionId);
  
  if (driverId) {
    query = query.eq('driver_id', driverId);
  }

  const { data, error } = await query.order('lap_number', { ascending: true });
  
  if (error) {
    console.error('Error fetching session laps:', error);
    return [];
  }
  return data || [];
};
