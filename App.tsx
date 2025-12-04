import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import TeacherView from './pages/TeacherView';
import CoordinatorDashboard from './pages/CoordinatorDashboard';
import HOSDashboard from './pages/HOSDashboard';
import { QrCode, ClipboardList, Shield, GraduationCap, CalendarClock, Hand, Lock, ChevronRight, X } from 'lucide-react';
import { getTimetableImage } from './services/storageService';

export type View = 'home' | 'teacher' | 'coordinator' | 'hos';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('home');
  const [timetableImage, setTimetableImage] = useState<string | null>(null);
  const [showCover, setShowCover] = useState(true);
  
  // Direct Launch State (from URL QR Scan)
  const [directClassId, setDirectClassId] = useState<string | null>(null);

  // Security State
  const [showPinModal, setShowPinModal] = useState(false);
  const [targetProtectedView, setTargetProtectedView] = useState<View | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  useEffect(() => {
    // 1. Load Timetable
    const img = getTimetableImage();
    setTimetableImage(img);
    if (!img) {
      setShowCover(false);
    }

    // 2. Check for URL Parameters (QR Code Direct Launch)
    const params = new URLSearchParams(window.location.search);
    const classIdParam = params.get('classId');
    if (classIdParam) {
        setDirectClassId(classIdParam);
    }
  }, []);

  const handleSmartCoverClick = () => {
      setShowCover(false);
      
      // If a class ID was found in the URL, jump straight to Teacher View
      if (directClassId) {
          setCurrentView('teacher');
      }
  };

  const handleProtectedNavigation = (view: View) => {
      setTargetProtectedView(view);
      setPinInput('');
      setPinError(false);
      setShowPinModal(true);
  };

  const verifyPin = () => {
      // HARDCODED PIN FOR DEMO: 1234
      if (pinInput === '1234') {
          if (targetProtectedView) setCurrentView(targetProtectedView);
          setShowPinModal(false);
      } else {
          setPinError(true);
          setPinInput('');
      }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* GSIS Watermark Layer */}
      <div className="fixed inset-0 z-0 pointer-events-none flex items-center justify-center overflow-hidden print:hidden">
         <div className="text-[30vw] font-black italic font-serif text-slate-200/50 transform -rotate-12 select-none whitespace-nowrap">
            GSIS
         </div>
      </div>

      <Navbar 
        currentView={currentView} 
        onChangeView={(view) => {
            if (view === 'home' || view === 'teacher') {
                setCurrentView(view);
            } else {
                handleProtectedNavigation(view);
            }
            setShowCover(false); 
        }} 
      />
      
      {/* PIN Security Modal */}
      {showPinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
              <div className="bg-white w-full max-w-sm rounded-2xl p-8 shadow-2xl text-center">
                  <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <Lock className="w-8 h-8 text-slate-700" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">Restricted Access</h3>
                  <p className="text-sm text-slate-500 mb-6">Enter PIN to access Coordinator/HOS area.</p>
                  
                  <div className="mb-6">
                      <input 
                        type="password" 
                        inputMode="numeric"
                        value={pinInput}
                        onChange={(e) => { setPinInput(e.target.value); setPinError(false); }}
                        placeholder="••••"
                        className={`text-center text-3xl tracking-[1em] w-full border-b-2 py-2 outline-none font-bold text-slate-800 ${pinError ? 'border-rose-500 text-rose-600' : 'border-slate-300 focus:border-indigo-600'}`}
                        maxLength={4}
                        autoFocus
                      />
                      {pinError && <p className="text-xs text-rose-500 mt-2 font-bold animate-pulse">Incorrect PIN. Try again.</p>}
                  </div>

                  <div className="flex gap-3">
                      <button 
                        onClick={() => setShowPinModal(false)}
                        className="flex-1 py-3 text-slate-500 font-medium hover:bg-slate-50 rounded-xl"
                      >
                          Cancel
                      </button>
                      <button 
                        onClick={verifyPin}
                        className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-lg"
                      >
                          Unlock
                      </button>
                  </div>
                  <p className="text-xs text-slate-300 mt-4">(Default PIN: 1234)</p>
              </div>
          </div>
      )}

      <main className="relative z-10">
        {currentView === 'home' && (
          <>
             {/* Smart Cover / Timetable View */}
             {timetableImage && showCover ? (
                <div 
                    onClick={handleSmartCoverClick}
                    className="fixed inset-0 z-50 bg-slate-100 flex flex-col items-center justify-center cursor-pointer animate-in fade-in duration-500"
                >
                    <div className="max-w-4xl w-full px-4 relative">
                        <div className="bg-white p-3 rounded-2xl shadow-2xl border-4 border-slate-900 rotate-1 hover:rotate-0 transition-transform duration-300 mb-12">
                            <img 
                                src={timetableImage} 
                                alt="Weekly Timetable" 
                                className="w-full h-auto rounded-xl max-h-[70vh] object-contain"
                            />
                        </div>
                        
                        <div className="absolute -bottom-16 left-0 right-0 flex justify-center w-full animate-bounce">
                             <div className="bg-slate-900 text-white px-8 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 border-2 border-white/20">
                                 {directClassId ? (
                                     <>
                                        <span>Proceed to Class</span>
                                        <ChevronRight className="w-5 h-5" />
                                     </>
                                 ) : (
                                     <>
                                        <Hand className="w-5 h-5" />
                                        <span>Tap to Enter App</span>
                                     </>
                                 )}
                             </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* Main Login Cards View */
                <div className="max-w-6xl mx-auto px-4 py-16 text-center animate-in slide-in-from-bottom-8 duration-500">
                     <div className="mb-10 inline-flex p-4 rounded-full bg-slate-200/80 backdrop-blur-sm shadow-inner">
                        <Shield className="w-12 h-12 text-blue-700" />
                     </div>
                     <h1 className="text-4xl md:text-6xl font-black italic font-serif tracking-tighter mb-4 drop-shadow-sm text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-blue-900">
                       GSIS IBMYP - PrepX
                     </h1>
                     <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-12 font-medium">
                       Streamlined attendance tracking for teachers and powerful insights for leadership.
                     </p>
        
                     <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
                        {/* Teacher Card */}
                        <div 
                          onClick={() => setCurrentView('teacher')}
                          className="group cursor-pointer bg-white/90 backdrop-blur p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-blue-200 transition-all flex flex-col items-center hover:-translate-y-1"
                        >
                            <div className="bg-blue-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <QrCode className="w-8 h-8 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-3">Teacher</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">
                              Scan QR codes, mark class attendance, and log specific reasons for late or absent students.
                            </p>
                        </div>
        
                        {/* Coordinator Card (LOCKED) */}
                        <div 
                          onClick={() => handleProtectedNavigation('coordinator')}
                          className="group cursor-pointer bg-white/90 backdrop-blur p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-indigo-200 transition-all flex flex-col items-center hover:-translate-y-1 relative overflow-hidden"
                        >
                             <div className="absolute top-4 right-4 text-slate-300 group-hover:text-indigo-500 transition-colors">
                                 <Lock className="w-5 h-5" />
                             </div>
                            <div className="bg-indigo-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <ClipboardList className="w-8 h-8 text-indigo-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-3">Coordinator</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">
                              Monitor live class strength, view submission logs, export monthly spreadsheets. (PIN Required)
                            </p>
                        </div>
        
                        {/* HOS Card (LOCKED) */}
                        <div 
                          onClick={() => handleProtectedNavigation('hos')}
                          className="group cursor-pointer bg-white/90 backdrop-blur p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-purple-200 transition-all flex flex-col items-center hover:-translate-y-1 relative overflow-hidden"
                        >
                            <div className="absolute top-4 right-4 text-slate-300 group-hover:text-purple-500 transition-colors">
                                 <Lock className="w-5 h-5" />
                             </div>
                            <div className="bg-purple-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <GraduationCap className="w-8 h-8 text-purple-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-3">HOS</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">
                              Access high-level executive summaries and AI-powered daily briefings. (PIN Required)
                            </p>
                        </div>
                     </div>
                     
                     {/* Button to show timetable again if needed */}
                     {timetableImage && (
                        <button 
                            onClick={() => setShowCover(true)}
                            className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-medium transition-colors px-4 py-2 rounded-full hover:bg-white/50 backdrop-blur"
                        >
                            <CalendarClock className="w-4 h-4" />
                            View Weekly Timetable
                        </button>
                     )}
                  </div>
             )}
          </>
        )}

        {currentView === 'teacher' && <TeacherView autoSelectedClassId={directClassId} />}
        {currentView === 'coordinator' && <CoordinatorDashboard />}
        {currentView === 'hos' && <HOSDashboard />}
      </main>
    </div>
  );
};

export default App;