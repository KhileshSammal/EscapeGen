
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="w-full bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-5 flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">EscapeGen</h1>
          <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold">Weekend Explorer</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-neutral-50 border border-neutral-100 text-neutral-600 hover:bg-neutral-100 transition-colors"
            aria-label="Settings"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
