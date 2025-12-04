import React from 'react';
import { School, LayoutDashboard, UserCheck, Briefcase, CalendarDays, Lock } from 'lucide-react';
import { View } from '../App';

interface NavbarProps {
  currentView: View;
  onChangeView: (view: View) => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, onChangeView }) => {
  const todayDate = new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <nav className="bg-slate-900 text-white shadow-lg sticky top-0 z-40 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center cursor-pointer group" onClick={() => onChangeView('home')}>
            <School className="h-8 w-8 text-blue-400 mr-3 group-hover:scale-110 transition-transform" />
            <div className="flex flex-col justify-center">
                <span className="font-black text-2xl tracking-tighter leading-none italic font-serif text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-white">
                  GSIS IBMYP - PrepX
                </span>
                <span className="text-[10px] text-slate-400 font-medium leading-none mt-1.5 flex items-center uppercase tracking-widest">
                    <CalendarDays className="w-3 h-3 mr-1" /> {todayDate}
                </span>
            </div>
          </div>
          <div className="flex space-x-1 sm:space-x-2">
            <button
              onClick={() => onChangeView('teacher')}
              className={`px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors ${
                currentView === 'teacher' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <UserCheck className="w-4 h-4 mr-2 hidden sm:block" />
              Teacher
            </button>
            <button
              onClick={() => onChangeView('coordinator')}
              className={`px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors ${
                currentView === 'coordinator' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Lock className="w-3 h-3 mr-1.5 opacity-70" />
              <span className="hidden sm:block">Coord</span>
            </button>
             <button
              onClick={() => onChangeView('hos')}
              className={`px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors ${
                currentView === 'hos' ? 'bg-purple-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Lock className="w-3 h-3 mr-1.5 opacity-70" />
              <span className="hidden sm:block">HOS</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;