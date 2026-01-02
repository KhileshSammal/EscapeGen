
import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import TripCard from './components/TripCard';
import { Vibe, Budget, TravelMode, TripType, UserPreferences, TripOption } from './types';
import { VIBE_METADATA, BUDGET_OPTIONS, INDIAN_CITIES, TRIP_TYPES } from './constants';
import { generateWeekendTrips } from './services/geminiService';

const App: React.FC = () => {
  const [step, setStep] = useState<'input' | 'loading' | 'results'>('input');
  const [view, setView] = useState<'generator' | 'board'>('generator');
  
  // Input states
  const [city, setCity] = useState('');
  const [detectedCity, setDetectedCity] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | undefined>(undefined);
  const [budget, setBudget] = useState<Budget>(Budget.MID);
  const [vibe, setVibe] = useState<Vibe>(Vibe.CHILL);
  const [mode, setMode] = useState<TravelMode>(TravelMode.ANY);
  const [tripType, setTripType] = useState<TripType>(TripType.SOLO);

  // Data states
  const [trips, setTrips] = useState<TripOption[]>([]);
  const [boardTrips, setBoardTrips] = useState<TripOption[]>([]);
  
  // Board filter states
  const [boardSearch, setBoardSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | '30' | '90'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'saved' | 'completed'>('all');

  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    const storedBoard = localStorage.getItem('escape_board');
    if (storedBoard) {
      try {
        setBoardTrips(JSON.parse(storedBoard));
      } catch (e) {
        console.error("Failed to parse board data", e);
      }
    }
  }, []);

  const saveToBoard = (nextBoard: TripOption[]) => {
    setBoardTrips(nextBoard);
    localStorage.setItem('escape_board', JSON.stringify(nextBoard));
  };

  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`, {
        headers: {
          'Accept-Language': 'en-US,en;q=0.9',
          'User-Agent': 'WeekendEscapeGenerator/1.0'
        }
      });
      const data = await response.json();
      const cityFound = data.address.city || data.address.town || data.address.village || data.address.state_district || data.address.suburb;
      if (cityFound) {
        setDetectedCity(cityFound);
        setCoords({ latitude: lat, longitude: lon });
        setLocationError(null);
      } else {
        setLocationError("Couldn't pinpoint city name.");
      }
    } catch (err) {
      console.error("Geocoding failed", err);
      setLocationError("Network error detecting city.");
    } finally {
      setIsLocating(false);
    }
  };

  const handleLocate = () => {
    setIsLocating(true);
    setLocationError(null);
    setDetectedCity(null);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => reverseGeocode(position.coords.latitude, position.coords.longitude),
        (error) => {
          let msg = "Location access denied.";
          if (error.code === error.TIMEOUT) msg = "Request timed out.";
          setLocationError(msg);
          setIsLocating(false);
        },
        { timeout: 10000 }
      );
    } else {
      setLocationError("Geolocation not supported.");
      setIsLocating(false);
    }
  };

  const handleGenerate = async () => {
    if (!city) return;
    setStep('loading');
    try {
      const generated = await generateWeekendTrips({ city, budget, vibe, travelMode: mode, tripType, coords });
      setTrips(generated);
      setStep('results');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      setStep('input');
      alert("Something went wrong. Let's try again.");
    }
  };

  const handleVote = (id: string) => {
    setTrips(prev => prev.map(t => t.id === id ? { ...t, votes: (t.votes || 0) + 1 } : t));
    // Also update board if it's there
    const nextBoard = boardTrips.map(t => t.id === id ? { ...t, votes: (t.votes || 0) + 1 } : t);
    saveToBoard(nextBoard);
  };

  const toggleSave = (trip: TripOption) => {
    const exists = boardTrips.find(t => t.id === trip.id);
    if (exists) {
      saveToBoard(boardTrips.filter(t => t.id !== trip.id));
    } else {
      saveToBoard([{ ...trip, status: 'saved', timestamp: Date.now() }, ...boardTrips]);
    }
  };

  const markCompleted = (trip: TripOption) => {
    const now = new Date().toISOString();
    const existing = boardTrips.find(t => t.id === trip.id);
    
    let next: TripOption[];
    if (existing) {
      next = boardTrips.map(t => t.id === trip.id ? { ...t, status: 'completed', completionDate: now } : t);
    } else {
      next = [{ ...trip, status: 'completed', completionDate: now, timestamp: Date.now() }, ...boardTrips];
    }
    saveToBoard(next);
  };

  const filteredBoard = useMemo(() => {
    return boardTrips.filter(t => {
      const matchesSearch = t.destination.toLowerCase().includes(boardSearch.toLowerCase());
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      
      if (!matchesSearch || !matchesStatus) return false;
      if (dateFilter === 'all') return true;
      
      const referenceTime = t.status === 'completed' && t.completionDate 
        ? new Date(t.completionDate).getTime() 
        : t.timestamp;
        
      const now = Date.now();
      const daysDiff = (now - referenceTime) / (1000 * 60 * 60 * 24);
      
      if (dateFilter === '30') return daysDiff <= 30;
      if (dateFilter === '90') return daysDiff <= 90;
      
      return true;
    });
  }, [boardTrips, boardSearch, dateFilter, statusFilter]);

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f7f4] font-sans">
      <Header />

      <div className="w-full bg-white border-b border-neutral-100 flex justify-center sticky top-[64px] z-40 px-4">
        <div className="flex w-full max-w-7xl">
          <button 
            onClick={() => setView('generator')}
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest transition-all border-b-2 ${view === 'generator' ? 'border-neutral-900 text-neutral-900' : 'border-transparent text-neutral-400'}`}
          >
            Discover
          </button>
          <button 
            onClick={() => setView('board')}
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest transition-all border-b-2 ${view === 'board' ? 'border-neutral-900 text-neutral-900' : 'border-transparent text-neutral-400'}`}
          >
            My Board ({boardTrips.length})
          </button>
        </div>
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">
        {view === 'generator' ? (
          <>
            {step === 'input' && (
              <div className="max-w-2xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <section className="text-center md:text-left">
                  <h2 className="text-4xl md:text-5xl font-bold mb-2 tracking-tight">Where are you?</h2>
                  <p className="text-neutral-500 text-lg mb-6 leading-relaxed">Let's find the best escapes starting from your city.</p>
                  
                  <div className="relative">
                    <input 
                      type="text"
                      value={city}
                      onChange={(e) => { setCity(e.target.value); setDetectedCity(null); }}
                      placeholder="Type your city..."
                      className="w-full bg-white border border-neutral-200 px-8 py-6 rounded-[2.5rem] text-xl font-bold focus:outline-none focus:ring-4 focus:ring-black/5 transition-all shadow-xl shadow-black/5"
                    />
                    <button 
                      onClick={handleLocate}
                      disabled={isLocating}
                      className="absolute right-5 top-1/2 -translate-y-1/2 p-3 text-neutral-400 hover:text-black transition-colors"
                    >
                      {isLocating ? (
                        <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {detectedCity && (
                    <div className="mt-6 p-5 bg-neutral-900 text-white rounded-[2rem] flex items-center justify-between animate-in fade-in zoom-in duration-300 shadow-xl shadow-black/10">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🏙️</span>
                        <span className="text-base font-bold">In <span className="underline underline-offset-4">{detectedCity}</span>?</span>
                      </div>
                      <div className="flex gap-4">
                        <button onClick={() => setDetectedCity(null)} className="text-xs font-black uppercase text-neutral-400 hover:text-white">No</button>
                        <button onClick={() => { setCity(detectedCity); setDetectedCity(null); }} className="px-6 py-2 bg-white text-neutral-900 text-xs font-black uppercase rounded-full">Yes</button>
                      </div>
                    </div>
                  )}

                  {locationError && <p className="mt-3 text-sm text-red-500 font-bold italic">{locationError}</p>}
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <section>
                    <h2 className="text-2xl font-bold mb-6 tracking-tight">Who's going?</h2>
                    <div className="grid grid-cols-3 gap-3">
                      {TRIP_TYPES.map((t) => (
                        <button 
                          key={t.id}
                          onClick={() => setTripType(t.id as TripType)}
                          className={`flex flex-col items-center justify-center gap-3 p-6 rounded-[2.5rem] transition-all border-2 ${tripType === t.id ? 'bg-neutral-900 text-white border-neutral-900 scale-105 shadow-2xl' : 'bg-white border-neutral-100 text-neutral-400 hover:border-neutral-300'}`}
                        >
                          <span className="text-3xl">{t.icon}</span>
                          <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold mb-6 tracking-tight">Current Vibe?</h2>
                    <div className="grid grid-cols-3 gap-3">
                      {VIBE_METADATA.map((v) => (
                        <button 
                          key={v.id}
                          onClick={() => setVibe(v.id as Vibe)}
                          className={`flex flex-col items-center justify-center gap-3 p-4 rounded-[2rem] transition-all border-2 ${vibe === v.id ? 'bg-neutral-900 text-white border-neutral-900 shadow-xl' : 'bg-white border-neutral-100 text-neutral-400 hover:border-neutral-300'}`}
                        >
                          <span className="text-2xl">{v.icon}</span>
                          <span className="text-[9px] font-black uppercase tracking-widest text-center leading-tight">{v.label}</span>
                        </button>
                      ))}
                    </div>
                  </section>
                </div>

                <section>
                  <h2 className="text-2xl font-bold mb-6 tracking-tight">Budget Range?</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {BUDGET_OPTIONS.map((b) => (
                      <button 
                        key={b}
                        onClick={() => setBudget(b)}
                        className={`px-4 py-6 rounded-[1.5rem] border-2 transition-all font-black text-xs uppercase tracking-widest ${budget === b ? 'bg-white border-neutral-900 text-neutral-900 shadow-sm' : 'bg-white border-neutral-50 text-neutral-300 hover:border-neutral-200'}`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="pt-8">
                  <button 
                    onClick={handleGenerate}
                    disabled={!city}
                    className={`w-full py-7 rounded-[2.5rem] font-black text-xl uppercase tracking-widest shadow-2xl transition-all flex items-center justify-center gap-4 ${!city ? 'bg-neutral-100 text-neutral-300 cursor-not-allowed shadow-none' : 'bg-neutral-900 text-white hover:bg-black hover:-translate-y-1 shadow-black/10'}`}
                  >
                    Build My Itinerary
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </button>
                </section>
              </div>
            )}

            {step === 'loading' && (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-10">
                <div className="relative">
                  <div className="w-32 h-32 border-[10px] border-neutral-100 border-t-neutral-900 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-5xl animate-pulse">🗺️</div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-3xl font-black uppercase tracking-widest">Curation Engine</h3>
                  <p className="text-neutral-500 text-lg animate-pulse max-w-sm mx-auto">Scouring {city} for {tripType.toLowerCase()} escapes that match the {vibe.toLowerCase()} vibe...</p>
                </div>
              </div>
            )}

            {step === 'results' && (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-10">
                {/* Impulsive Nudge */}
                {trips[0]?.nudgeReason && (
                  <div className="p-7 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 rounded-[3rem] flex items-center gap-6 shadow-2xl shadow-black/20 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-10 opacity-10 scale-150 rotate-12 group-hover:scale-125 transition-transform">✨</div>
                    <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-[2rem] flex items-center justify-center shrink-0 border border-white/20">
                      <span className="text-4xl">🚀</span>
                    </div>
                    <div>
                      <h3 className="font-black text-xl uppercase tracking-widest text-white/90 mb-1">Why go now?</h3>
                      <p className="text-neutral-400 text-sm italic font-medium leading-relaxed max-w-md">"{trips[0].nudgeReason}"</p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div>
                    <h2 className="text-5xl font-black tracking-tighter uppercase mb-2">Weekend Picks</h2>
                    <p className="text-neutral-500 text-lg font-medium">Curated {tripType.toLowerCase()} plans near {city}.</p>
                  </div>
                  <button 
                    onClick={() => setStep('input')}
                    className="flex items-center justify-center gap-3 px-8 py-5 bg-white border border-neutral-200 rounded-2xl hover:bg-neutral-50 shadow-sm font-black text-xs uppercase tracking-widest transition-all active:scale-95"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Reset
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                  {trips.map(trip => (
                    <TripCard 
                      key={trip.id} 
                      trip={trip} 
                      isSaved={!!boardTrips.find(s => s.id === trip.id && s.status === 'saved')}
                      onSave={toggleSave}
                      onComplete={markCompleted}
                      onVote={handleVote}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row gap-10 items-start justify-between">
              <div className="space-y-3">
                <h2 className="text-6xl font-black tracking-tighter uppercase">My Board</h2>
                <p className="text-neutral-500 text-xl font-medium">Your personal vault of weekend escapes.</p>
              </div>
              
              <div className="flex flex-col gap-6 w-full md:w-auto">
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setStatusFilter('all')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === 'all' ? 'bg-neutral-900 text-white shadow-xl' : 'bg-white border border-neutral-200 text-neutral-400'}`}>All</button>
                  <button onClick={() => setStatusFilter('saved')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === 'saved' ? 'bg-neutral-900 text-white shadow-xl' : 'bg-white border border-neutral-200 text-neutral-400'}`}>Bucket List</button>
                  <button onClick={() => setStatusFilter('completed')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === 'completed' ? 'bg-neutral-900 text-white shadow-xl' : 'bg-white border border-neutral-200 text-neutral-400'}`}>Done</button>
                </div>
              </div>
            </div>

            <div className="relative group">
              <input 
                type="text"
                value={boardSearch}
                onChange={(e) => setBoardSearch(e.target.value)}
                placeholder="Search your board..."
                className="w-full bg-white border border-neutral-200 px-10 py-6 rounded-[2.5rem] text-xl font-bold focus:outline-none focus:ring-4 focus:ring-black/5 transition-all shadow-xl shadow-black/5"
              />
            </div>

            {filteredBoard.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {filteredBoard.map(trip => (
                  <TripCard 
                    key={trip.id} 
                    trip={trip} 
                    isSaved={trip.status === 'saved'}
                    isCompleted={trip.status === 'completed'}
                    onSave={toggleSave}
                    onComplete={markCompleted}
                    onVote={handleVote}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-40 bg-white rounded-[4rem] border-2 border-dashed border-neutral-100 shadow-sm">
                <div className="text-8xl mb-8 opacity-20">🧗‍♀️</div>
                <h3 className="text-3xl font-black uppercase tracking-widest text-neutral-900 mb-4">Board is empty</h3>
                <p className="text-neutral-500 mb-10 max-w-sm mx-auto leading-relaxed text-lg font-medium">Your next adventure is waiting to be built. Let's start with a vibe check.</p>
                <button onClick={() => setView('generator')} className="px-12 py-6 bg-neutral-900 text-white rounded-[2rem] font-black uppercase tracking-widest hover:bg-black transition-all shadow-2xl shadow-black/20">Discovery Home</button>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="w-full max-w-7xl mx-auto px-6 py-16 border-t border-neutral-100 flex flex-col md:flex-row items-center justify-between gap-10">
        <div className="text-center md:text-left">
          <p className="text-neutral-400 text-[10px] font-black uppercase tracking-[0.3em] mb-3">EscapeGen Engine v2.0</p>
          <p className="text-neutral-400 text-sm font-medium">Built for the spontaneous Indian traveler.</p>
        </div>
        <div className="flex justify-center gap-10">
           <span className="text-xs font-black uppercase tracking-widest text-neutral-300 hover:text-black cursor-pointer transition-colors">Privacy</span>
           <span className="text-xs font-black uppercase tracking-widest text-neutral-300 hover:text-black cursor-pointer transition-colors">Support</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
