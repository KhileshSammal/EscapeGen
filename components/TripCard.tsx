
import React, { useState } from 'react';
import { TripOption } from '../types';

interface TripCardProps {
  trip: TripOption;
  onSave: (trip: TripOption) => void;
  onComplete?: (trip: TripOption) => void;
  onVote?: (tripId: string) => void;
  isSaved: boolean;
  isCompleted?: boolean;
}

const TripCard: React.FC<TripCardProps> = ({ trip, onSave, onComplete, onVote, isSaved, isCompleted }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const weatherIcons = {
    sunny: '☀️',
    cloudy: '☁️',
    rainy: '🌧️',
    cool: '❄️'
  };

  const typeIcons = {
    Solo: '🧘',
    Couple: '❤️',
    Group: '👋'
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev + 1) % trip.images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev - 1 + trip.images.length) % trip.images.length);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    let shareUrl = '';
    try {
      const currentUrl = window.location.href;
      if (currentUrl.startsWith('http')) {
        shareUrl = new URL(currentUrl).href;
      }
    } catch (e) {
      console.warn("Invalid share URL");
    }

    const shareData: ShareData = {
      title: `Weekend in ${trip.destination}`,
      text: `Checking out ${trip.destination} for the weekend! ${trip.whyFits}`,
      ...(shareUrl && { url: shareUrl })
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') console.error('Share failed:', err);
      }
    } else {
      const textToCopy = `${shareData.title}\n${shareData.text}${shareUrl ? `\n${shareUrl}` : ''}`;
      try {
        await navigator.clipboard.writeText(textToCopy);
        alert('Trip details copied to clipboard!');
      } catch (err) {
        alert('Could not share or copy.');
      }
    }
  };

  const openInMaps = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const currentImage = trip.images[activeImageIndex] || { url: `https://picsum.photos/seed/${trip.destination}/800/600`, sourceUrl: '#' };

  return (
    <div 
      className={`group bg-white border border-neutral-200 rounded-[2.5rem] overflow-hidden flex flex-col transition-all duration-500 hover:shadow-2xl hover:shadow-black/5 ${isExpanded ? 'ring-2 ring-neutral-900' : ''}`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Header Image Area */}
      <div className="relative h-64 bg-neutral-100 overflow-hidden cursor-pointer">
        <img 
          src={currentImage.url} 
          alt={`${trip.destination}`}
          className="w-full h-full object-cover grayscale-[5%] group-hover:grayscale-0 transition-all duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90"></div>
        
        {/* Carousel Overlay */}
        {trip.images.length > 1 && (
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={prevImage} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 transition-all active:scale-90">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={nextImage} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 transition-all active:scale-90">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        )}

        {/* Tags */}
        <div className="absolute top-5 left-5 flex flex-wrap gap-2 max-w-[85%]">
          {trip.tag && (
            <span className={`px-3 py-1 text-[10px] font-bold uppercase rounded-full shadow-lg border border-white/20 ${trip.tag === 'Underrated' ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'}`}>
              {trip.tag}
            </span>
          )}
          <span className="px-3 py-1 text-[10px] font-bold uppercase rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 shadow-lg flex items-center gap-1">
             {typeIcons[trip.tripType]} {trip.tripType}
          </span>
          <span className="px-3 py-1 text-[10px] font-bold uppercase rounded-full bg-black/40 backdrop-blur-md text-white border border-white/10 shadow-lg">
            Score: {trip.realityScore}/10
          </span>
        </div>

        {/* Floating Vote Button for Groups */}
        {trip.tripType === 'Group' && onVote && (
          <button 
            onClick={(e) => { e.stopPropagation(); onVote(trip.id); }}
            className="absolute top-5 right-5 h-10 px-4 bg-white rounded-2xl flex items-center gap-2 shadow-xl hover:scale-105 transition-transform active:scale-95"
          >
            <span className="text-lg">🔥</span>
            <span className="text-xs font-bold text-neutral-900">{trip.votes || 0}</span>
          </button>
        )}

        <div className="absolute bottom-6 left-6 right-6">
          <h2 className="text-3xl font-bold text-white drop-shadow-xl mb-1">{trip.destination}</h2>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] text-white font-bold uppercase tracking-wider">
              {weatherIcons[trip.weather]} {trip.weatherSensitivity}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-7 space-y-6">
        <div>
          <p className="text-base font-medium text-neutral-600 leading-relaxed italic">"{trip.whyFits}"</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-1 bg-neutral-50 rounded-[1.5rem] p-4 border border-neutral-100">
          <div className="flex flex-col items-center border-r border-neutral-200">
             <span className="text-[10px] text-neutral-400 uppercase font-black tracking-widest mb-1">Travel</span>
             <span className="text-sm font-bold text-neutral-900">{trip.travelTime}</span>
          </div>
          <div className="flex flex-col items-center border-r border-neutral-200">
             <span className="text-[10px] text-neutral-400 uppercase font-black tracking-widest mb-1">Dist</span>
             <span className="text-sm font-bold text-neutral-900">{trip.distance}km</span>
          </div>
          <div className="flex flex-col items-center">
             <span className="text-[10px] text-neutral-400 uppercase font-black tracking-widest mb-1">Crowd</span>
             <span className="text-sm font-bold text-neutral-900">{trip.crowdLevel}</span>
          </div>
        </div>

        {/* Cost Breakdown - The "Planner" Feature */}
        <div className="space-y-3">
           <h4 className="text-[10px] uppercase font-black text-neutral-900 tracking-widest flex justify-between items-center">
             Estimated Spends
             <span className="text-neutral-400 font-bold">{trip.budgetRange}</span>
           </h4>
           <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-neutral-100">
             <div className="bg-neutral-900" style={{ width: '40%' }} />
             <div className="bg-neutral-600" style={{ width: '25%' }} />
             <div className="bg-neutral-400" style={{ width: '20%' }} />
             <div className="bg-neutral-200" style={{ width: '15%' }} />
           </div>
           <div className="grid grid-cols-2 gap-y-2 gap-x-4">
             <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-neutral-900" />
               <span className="text-[10px] text-neutral-500 font-bold">Stay: {trip.costBreakdown.stay}</span>
             </div>
             <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-neutral-600" />
               <span className="text-[10px] text-neutral-500 font-bold">Food: {trip.costBreakdown.food}</span>
             </div>
             <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
               <span className="text-[10px] text-neutral-500 font-bold">Travel: {trip.costBreakdown.travel}</span>
             </div>
             <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-neutral-200" />
               <span className="text-[10px] text-neutral-500 font-bold">Misc: {trip.costBreakdown.misc}</span>
             </div>
           </div>
        </div>

        {/* Detailed Section when expanded */}
        {!isExpanded && (
           <button className="w-full py-4 border-t border-neutral-100 text-[10px] font-black uppercase text-neutral-400 hover:text-neutral-900 transition-colors animate-pulse tracking-widest">
             Tap to Plan Logistics
           </button>
        )}

        {isExpanded && (
          <div className="pt-2 space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
            {/* Time-blocked Itinerary */}
            <div className="space-y-4">
              <h4 className="text-[10px] uppercase font-black text-neutral-900 tracking-widest border-b border-neutral-100 pb-2">The Schedule</h4>
              {trip.itinerary.map((day) => (
                <div key={day.day} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-white bg-neutral-900 px-3 py-1 rounded-full uppercase">Day {day.day}</span>
                    <span className="text-sm font-bold text-neutral-800">{day.title}</span>
                  </div>
                  <div className="ml-4 space-y-5 border-l-2 border-neutral-100 pl-6">
                    {day.items.map((item, i) => (
                      <div key={i} className="relative">
                        <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-neutral-900 border-2 border-white shadow-sm" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block mb-1">{item.time}</span>
                        <p className="text-sm font-bold text-neutral-900 mb-0.5">{item.activity}</p>
                        {item.note && <p className="text-xs text-neutral-500 italic">"{item.note}"</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Trusted Stays */}
            <div className="space-y-4">
               <h4 className="text-[10px] uppercase font-black text-neutral-900 tracking-widest border-b border-neutral-100 pb-2">Where to crash</h4>
               <div className="space-y-2">
                 {trip.hotels.map((hotel, i) => (
                   <div 
                    key={i} 
                    onClick={(e) => openInMaps(e, hotel.mapsUrl)}
                    className="flex justify-between items-center p-4 bg-white border border-neutral-100 rounded-2xl hover:border-neutral-900 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
                   >
                     <div>
                       <p className="text-sm font-bold text-neutral-900">{hotel.name}</p>
                       <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-widest">{hotel.type}</p>
                     </div>
                     <span className="text-xs font-bold text-neutral-900">{hotel.approxPrice}</span>
                   </div>
                 ))}
               </div>
            </div>

            {/* Brutal Reality Check */}
            <div className="bg-red-50/50 p-5 rounded-[2rem] border border-red-100">
               <h4 className="text-[10px] uppercase font-black text-red-700 mb-2 tracking-widest">Brutally Honest Check</h4>
               <p className="text-xs text-red-900 leading-relaxed font-medium">{trip.notForEveryone}</p>
            </div>

            {/* Traveler Stories */}
            <div className="space-y-4">
              <h4 className="text-[10px] uppercase font-black text-neutral-900 tracking-widest border-b border-neutral-100 pb-2">Recent Stories</h4>
              <div className="space-y-3">
                {trip.userStories.map((story, i) => (
                  <div key={i} className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
                    <p className="text-xs text-neutral-600 leading-relaxed italic mb-2">"{story.text}"</p>
                    <div className="flex items-center gap-2">
                       <div className="w-5 h-5 rounded-full bg-neutral-200" />
                       <span className="text-[10px] font-bold text-neutral-400 uppercase">{story.username} • {story.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-neutral-50">
           <button 
             onClick={(e) => { e.stopPropagation(); onSave(trip); }}
             className={`flex-1 py-4 rounded-2xl font-bold text-sm transition-all shadow-sm ${isSaved ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200'}`}
           >
             {isSaved ? 'In My Board' : 'Save for Later'}
           </button>
           
           {!isCompleted && (
             <button 
               onClick={(e) => { e.stopPropagation(); onComplete?.(trip); }}
               className="flex-1 py-4 rounded-2xl font-bold text-sm bg-green-50 text-green-700 border border-green-100 hover:bg-green-100 transition-all shadow-sm"
             >
               Been There?
             </button>
           )}

           <button 
             onClick={handleShare}
             className="h-14 w-full sm:w-14 flex items-center justify-center bg-white border border-neutral-100 rounded-2xl hover:bg-neutral-50 transition-all active:scale-90"
           >
             <svg className="w-6 h-6 text-neutral-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 100-2.684 3 3 0 000 2.684zm0 12.684a3 3 0 100-2.684 3 3 0 000 2.684z" />
             </svg>
           </button>
        </div>
      </div>
    </div>
  );
};

export default TripCard;
