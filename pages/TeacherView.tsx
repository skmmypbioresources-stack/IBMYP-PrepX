import React, { useState, useEffect } from 'react';
import { QrCode, Save, Clock, XCircle, CheckCircle, Search, ArrowLeft, Sun, Moon, AlertTriangle, X, Calendar, History, Eye, Loader2, Lock, Edit3, Image as ImageIcon, ShieldCheck, KeyRound, Smartphone, MonitorX } from 'lucide-react';
import QRScanner from '../components/QRScanner';
import { ClassSection, StudentAttendanceRecord, AttendanceStatus, SessionType, DisciplinaryRecord } from '../types';
import { MOCK_TEACHERS } from '../constants';
import { saveAttendanceLog, saveDisciplinaryRecord, getDisciplinaryRecordsForToday, getClasses, getAppSettings, getExistingLogForClass, getTimetableImage, isDeviceTrusted, trustDevice } from '../services/storageService';

interface TeacherViewProps {
  autoSelectedClassId?: string | null;
}

const TeacherView: React.FC<TeacherViewProps> = ({ autoSelectedClassId }) => {
  // Security State
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  
  const [isScanning, setIsScanning] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassSection | null>(null);
  const [teacherName, setTeacherName] = useState(MOCK_TEACHERS[0]);
  const [session, setSession] = useState<SessionType>('Evening'); // Default to Evening now
  const [records, setRecords] = useState<Record<string, StudentAttendanceRecord>>({});
  const [searchTerm, setSearchTerm] = useState('');
  
  // Submission States
  const [submittedOverlay, setSubmittedOverlay] = useState(false);
  const [isClassSubmitted, setIsClassSubmitted] = useState(false); // Persistent state for the current class
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Settings State
  const [isMorningLocked, setIsMorningLocked] = useState(true);

  // Disciplinary Modal State
  const [reportingStudent, setReportingStudent] = useState<{id: string, name: string} | null>(null);
  const [reportDescription, setReportDescription] = useState('');

  // History / Status State
  const [showHistory, setShowHistory] = useState(false);
  const [myReports, setMyReports] = useState<DisciplinaryRecord[]>([]);

  // Timetable State
  const [showTimetable, setShowTimetable] = useState(false);
  const [timetableImage, setTimetableImage] = useState<string | null>(null);

  // Refresh reports and settings on load
  useEffect(() => {
    // 1. Check Security Trust
    if (isDeviceTrusted()) {
        setIsAuthorized(true);
    } else {
        setIsAuthorized(false);
    }

    // 2. Check Lock Settings
    const settings = getAppSettings();
    setIsMorningLocked(settings.isMorningLocked);
    if (settings.isMorningLocked) {
      setSession('Evening');
    }
    
    // 3. Load Timetable
    setTimetableImage(getTimetableImage());

    if (showHistory) {
      const allRecords = getDisciplinaryRecordsForToday();
      // Filter records reported by the current teacher
      setMyReports(allRecords.filter(r => r.reportedBy === teacherName));
    }
  }, [showHistory, teacherName]);

  // Handle Auto-Launch from Smart Cover (QR URL)
  useEffect(() => {
      // Only proceed if authorized AND autoSelectedClassId is present
      if (isAuthorized && autoSelectedClassId && !selectedClass) {
          const allClasses = getClasses();
          const targetClass = allClasses.find(c => c.id === autoSelectedClassId);
          if (targetClass) {
              handleScan(targetClass);
          }
      }
  }, [autoSelectedClassId, isAuthorized]);

  const verifyTeacherPin = () => {
      const settings = getAppSettings();
      const validPin = settings.teacherAccessPin || '8899';
      
      if (pinInput === validPin) {
          trustDevice();
          setIsAuthorized(true);
      } else {
          setPinError(true);
          setPinInput('');
      }
  };

  const handleScan = (cls: ClassSection) => {
    // Re-fetch the class details from storage to ensure we have the latest student list
    const allClasses = getClasses();
    const latestClassData = allClasses.find(c => c.id === cls.id) || cls;

    setSelectedClass(latestClassData);
    setIsScanning(false);
    
    // Check if a log already exists for this class + session today
    const existingLog = getExistingLogForClass(latestClassData.id, session);
    
    if (existingLog) {
        // EDIT MODE: Load existing data
        setIsEditMode(true);
        setIsClassSubmitted(false); // Allow them to edit it, but don't show "Submitted" disabled state yet
        setTeacherName(existingLog.teacherName); // Set to the teacher who originally marked it (optional, but good for context)
        
        const loadedRecords: Record<string, StudentAttendanceRecord> = {};
        existingLog.records.forEach(r => {
            loadedRecords[r.studentId] = r;
        });
        
        // Ensure any *new* students added to class since then are initialized
        latestClassData.students.forEach(s => {
            if (!loadedRecords[s.id]) {
                loadedRecords[s.id] = { studentId: s.id, status: AttendanceStatus.PRESENT };
            }
        });
        
        setRecords(loadedRecords);
    } else {
        // NEW MODE
        setIsEditMode(false);
        setIsClassSubmitted(false);
        // Initialize records as Present
        const initialRecords: Record<string, StudentAttendanceRecord> = {};
        latestClassData.students.forEach(s => {
          initialRecords[s.id] = { studentId: s.id, status: AttendanceStatus.PRESENT };
        });
        setRecords(initialRecords);
    }
    
    setSubmittedOverlay(false);
  };

  const updateStatus = (studentId: string, status: AttendanceStatus) => {
    if (isClassSubmitted) return; // Prevent edits after submission
    setRecords(prev => {
      const current = prev[studentId];
      if (!current) return prev;
      return {
        ...prev,
        [studentId]: { 
          ...current, 
          status, 
          reason: status === AttendanceStatus.PRESENT ? undefined : current.reason 
        }
      };
    });
  };

  const updateReason = (studentId: string, reason: string) => {
    if (isClassSubmitted) return;
    setRecords(prev => {
      const current = prev[studentId];
      if (!current) return prev;
      return {
        ...prev,
        [studentId]: { ...current, reason }
      };
    });
  };

  const markAllPresent = () => {
    if (!selectedClass || isClassSubmitted) return;
    setIsMarkingAll(true);
    const newRecords: Record<string, StudentAttendanceRecord> = {};
    selectedClass.students.forEach(s => {
      newRecords[s.id] = { studentId: s.id, status: AttendanceStatus.PRESENT };
    });
    setRecords(newRecords);
    setTimeout(() => setIsMarkingAll(false), 300);
  };

  const handleSubmitAttendance = () => {
    if (!selectedClass) return;

    // Validation: Check if Late/Absent have reasons
    const missingReason = Object.values(records).find(
      (r: StudentAttendanceRecord) => (r.status === AttendanceStatus.ABSENT || r.status === AttendanceStatus.LATE) && !r.reason?.trim()
    );

    if (missingReason) {
      alert("Please provide a reason for all Late or Absent students.");
      return;
    }

    saveAttendanceLog({
      id: Date.now().toString(),
      classId: selectedClass.id,
      timestamp: Date.now(),
      session,
      teacherName,
      records: Object.values(records) as StudentAttendanceRecord[]
    });

    // 1. Show Overlay Animation
    setSubmittedOverlay(true);
    
    // 2. Set Persistent "Done" State
    setIsClassSubmitted(true);

    // 3. Remove Overlay after delay, but keep "isClassSubmitted" true
    setTimeout(() => {
        setSubmittedOverlay(false);
    }, 2000);
  };

  const handleSaveReport = () => {
    if (!reportingStudent || !selectedClass || !reportDescription.trim()) return;
    
    saveDisciplinaryRecord({
      id: Date.now().toString(),
      studentId: reportingStudent.id,
      studentName: reportingStudent.name,
      classId: selectedClass.id,
      className: `${selectedClass.grade} - ${selectedClass.section}`,
      reportedBy: teacherName,
      description: reportDescription,
      timestamp: Date.now(),
      escalatedToHOS: false // Starts as false
    });

    alert("Incident reported successfully. You can track its status in 'My Reports'.");
    setReportingStudent(null);
    setReportDescription('');
  };

  // --- SECURITY INTERCEPTOR (PIN) ---
  if (!isAuthorized) {
      return (
          <div className="min-h-[80vh] flex items-center justify-center p-4">
              <div className="bg-white max-w-sm w-full rounded-2xl p-8 shadow-2xl border border-slate-100 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <ShieldCheck className="w-8 h-8 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mb-2">Teacher Authorization</h2>
                  <p className="text-sm text-slate-500 mb-6">
                      To prevent unauthorized access by students, please enter the Teacher PIN.
                      <br/>
                      <span className="font-semibold text-blue-600">You only need to do this once.</span>
                  </p>
                  
                  <div className="mb-6">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Access PIN</label>
                      <input 
                        type="password" 
                        inputMode="numeric"
                        value={pinInput}
                        onChange={(e) => { setPinInput(e.target.value); setPinError(false); }}
                        placeholder="••••"
                        className={`w-full text-center text-2xl font-bold tracking-[0.5em] py-3 border-b-2 outline-none ${pinError ? 'border-rose-500 text-rose-600' : 'border-slate-300 focus:border-blue-500 text-slate-800'}`}
                      />
                      {pinError && <p className="text-xs text-rose-500 mt-2 font-bold animate-pulse">Incorrect PIN</p>}
                  </div>

                  <button 
                    onClick={verifyTeacherPin}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                  >
                      <KeyRound className="w-4 h-4" />
                      Verify & Trust Device
                  </button>
                  <p className="text-xs text-slate-400 mt-4 italic">Contact Coordinator if you forgot the PIN.</p>
              </div>
          </div>
      );
  }

  if (isScanning) {
    return <QRScanner onScan={handleScan} onClose={() => setIsScanning(false)} />;
  }

  // Initial State: "Scan to Start" (If no class selected yet)
  if (!selectedClass) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 text-center">
        {/* History Modal for Dashboard View */}
        {showHistory && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 text-left">
                <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[80vh]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <History className="w-6 h-6 text-indigo-600" />
                            My Reported Incidents
                        </h3>
                        <button onClick={() => setShowHistory(false)} className="p-1 hover:bg-slate-100 rounded-full">
                            <X className="w-6 h-6 text-slate-500" />
                        </button>
                    </div>
                    
                    <div className="space-y-3">
                        {myReports.length === 0 ? (
                            <div className="text-center py-8 text-slate-400">
                                <p>No incidents reported by {teacherName} today.</p>
                            </div>
                        ) : (
                            myReports.map((report) => (
                                <div key={report.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className="font-bold text-slate-800">{report.studentName}</span>
                                            <span className="text-xs text-slate-500 ml-2">({report.className})</span>
                                        </div>
                                        <span className="text-xs text-slate-400">
                                            {new Date(report.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 italic mb-3">"{report.description}"</p>
                                    <div className="flex justify-end">
                                        {report.escalatedToHOS ? (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                                <CheckCircle className="w-3 h-3 mr-1.5" />
                                                Seen & Escalated
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-200 text-slate-600 border border-slate-300">
                                                <Clock className="w-3 h-3 mr-1.5" />
                                                Pending Review
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        )}
        
        {/* Timetable Modal */}
        {showTimetable && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                 <div className="bg-white w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl">
                     <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
                         <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                             <Calendar className="w-5 h-5 text-indigo-600" />
                             Weekly Prep Timetable
                         </h3>
                         <button onClick={() => setShowTimetable(false)} className="p-1 hover:bg-slate-200 rounded-full">
                            <X className="w-6 h-6 text-slate-500" />
                        </button>
                     </div>
                     <div className="p-4 bg-slate-100 flex items-center justify-center min-h-[300px]">
                         {timetableImage ? (
                             <img src={timetableImage} alt="Weekly Timetable" className="max-w-full h-auto rounded-lg shadow-sm" />
                         ) : (
                             <div className="text-slate-400 text-center">
                                 <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                 <p>No timetable has been uploaded by the coordinator yet.</p>
                             </div>
                         )}
                     </div>
                 </div>
            </div>
        )}

        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 relative">
            {/* Action Buttons */}
            <div className="absolute top-4 right-4 flex gap-2">
                <button 
                    onClick={() => setShowTimetable(true)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                    title="View Weekly Timetable"
                >
                    <Calendar className="w-6 h-6" />
                </button>
                <button 
                    onClick={() => setShowHistory(true)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                    title="View My Report Status"
                >
                    <History className="w-6 h-6" />
                </button>
            </div>

            <div className="bg-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <QrCode className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Prep Duty Check-in</h2>
            <p className="text-slate-500 text-sm mb-6">Select your session and identify yourself.</p>
            
            <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-600 px-4 py-1.5 rounded-full text-sm font-semibold mb-8">
                <Calendar className="w-4 h-4" />
                {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            
            <div className="space-y-4 mb-6 text-left">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Select Session</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => !isMorningLocked && setSession('Morning')}
                      disabled={isMorningLocked}
                      className={`p-3 rounded-lg border flex items-center justify-center gap-2 transition-all relative ${
                        isMorningLocked 
                        ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-75' 
                        : session === 'Morning' 
                            ? 'bg-amber-100 border-amber-300 text-amber-800 ring-2 ring-amber-300' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {isMorningLocked ? <Lock className="w-4 h-4" /> : <Sun className="w-4 h-4" />} 
                      Morning
                      {isMorningLocked && <span className="absolute -top-2 right-2 bg-slate-600 text-white text-[10px] px-1.5 rounded">LOCKED</span>}
                    </button>
                    <button 
                      onClick={() => setSession('Evening')}
                      className={`p-3 rounded-lg border flex items-center justify-center gap-2 transition-all ${
                        session === 'Evening' 
                        ? 'bg-indigo-100 border-indigo-300 text-indigo-800 ring-2 ring-indigo-300' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Moon className="w-4 h-4" /> Evening
                    </button>
                  </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Select Teacher</label>
                    <select 
                        value={teacherName} 
                        onChange={(e) => setTeacherName(e.target.value)}
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                        {MOCK_TEACHERS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            </div>

            <button
            onClick={() => setIsScanning(true)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center transition-transform active:scale-95 shadow-lg shadow-emerald-200"
            >
            <QrCode className="w-6 h-6 mr-2" />
            Scan Class Code
            </button>
        </div>
      </div>
    );
  }

  // Attendance Form
  const filteredStudents = selectedClass.students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats
  const total = selectedClass.students.length;
  const present = Object.values(records).filter((r: StudentAttendanceRecord) => r.status === AttendanceStatus.PRESENT).length;
  const absent = Object.values(records).filter((r: StudentAttendanceRecord) => r.status === AttendanceStatus.ABSENT).length;
  const late = Object.values(records).filter((r: StudentAttendanceRecord) => r.status === AttendanceStatus.LATE).length;

  return (
    <div className="max-w-3xl mx-auto p-4 pb-24">
      
      {/* Full Screen Success Overlay */}
      {submittedOverlay && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
             <div className="text-center">
                <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-[bounce_1s_infinite]">
                  <CheckCircle className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Submitted!</h2>
                <p className="text-emerald-200">
                    {isEditMode ? "Attendance record updated." : "Attendance recorded successfully."}
                </p>
             </div>
           </div>
      )}
      
      {/* Timetable Modal (Reused) */}
      {showTimetable && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                 <div className="bg-white w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl">
                     <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
                         <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                             <Calendar className="w-5 h-5 text-indigo-600" />
                             Weekly Prep Timetable
                         </h3>
                         <button onClick={() => setShowTimetable(false)} className="p-1 hover:bg-slate-200 rounded-full">
                            <X className="w-6 h-6 text-slate-500" />
                        </button>
                     </div>
                     <div className="p-4 bg-slate-100 flex items-center justify-center min-h-[300px]">
                         {timetableImage ? (
                             <img src={timetableImage} alt="Weekly Timetable" className="max-w-full h-auto rounded-lg shadow-sm" />
                         ) : (
                             <div className="text-slate-400 text-center">
                                 <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                 <p>No timetable has been uploaded by the coordinator yet.</p>
                             </div>
                         )}
                     </div>
                 </div>
            </div>
      )}

      {/* Report Modal */}
      {reportingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Report Issue</h3>
                        <p className="text-slate-500 text-sm">Logging incident for <span className="font-semibold text-slate-800">{reportingStudent.name}</span></p>
                    </div>
                    <button onClick={() => setReportingStudent(null)} className="p-1 hover:bg-slate-100 rounded-full">
                        <X className="w-6 h-6 text-slate-500" />
                    </button>
                </div>
                
                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Description of Issue / Behavior</label>
                    <textarea
                        value={reportDescription}
                        onChange={(e) => setReportDescription(e.target.value)}
                        placeholder="e.g., Disruptive in class, improper uniform, fighting..."
                        className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none h-32 resize-none"
                    />
                </div>

                <button 
                    onClick={handleSaveReport}
                    disabled={!reportDescription.trim()}
                    className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl shadow-lg shadow-rose-200 transition-all active:scale-95"
                >
                    Save Report
                </button>
            </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
          <button onClick={() => setSelectedClass(null)} className="text-slate-500 hover:text-slate-800 flex items-center gap-1">
              <ArrowLeft className="w-5 h-5" /> Back
          </button>
          <div className="flex gap-2 items-center">
              <button 
                onClick={() => setShowTimetable(true)}
                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                title="View Timetable"
              >
                  <Calendar className="w-5 h-5" />
              </button>
              <div className="text-right">
                  <h1 className="text-xl font-bold text-slate-900">{selectedClass.grade} - {selectedClass.section}</h1>
                  <div className="flex items-center justify-end gap-2 text-sm text-slate-500">
                    <span className="font-medium text-slate-900">{teacherName}</span>
                    <span>•</span>
                    <span className={`flex items-center ${session === 'Morning' ? 'text-amber-600' : 'text-indigo-600'}`}>
                    {session === 'Morning' ? <Sun className="w-3 h-3 mr-1"/> : <Moon className="w-3 h-3 mr-1"/>}
                    {session} Prep
                    </span>
                  </div>
              </div>
          </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-2 mb-6 text-center">
          <div className="bg-white p-2 rounded-lg border shadow-sm">
            <div className="text-xs text-slate-500 uppercase">Total</div>
            <div className="text-xl font-bold">{total}</div>
          </div>
          <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100 shadow-sm">
            <div className="text-xs text-emerald-600 uppercase">Present</div>
            <div className="text-xl font-bold text-emerald-700">{present}</div>
          </div>
          <div className="bg-rose-50 p-2 rounded-lg border border-rose-100 shadow-sm">
            <div className="text-xs text-rose-600 uppercase">Absent</div>
            <div className="text-xl font-bold text-rose-700">{absent}</div>
          </div>
          <div className="bg-amber-50 p-2 rounded-lg border border-amber-100 shadow-sm">
            <div className="text-xs text-amber-600 uppercase">Late</div>
            <div className="text-xl font-bold text-amber-700">{late}</div>
          </div>
      </div>

      {/* Edit Mode Banner */}
      {isEditMode && !isClassSubmitted && (
         <div className="mb-4 bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-center gap-3 text-amber-800 text-sm">
            <Edit3 className="w-5 h-5" />
            <p>
                <strong>Edit Mode:</strong> You are updating an existing attendance record for this session. 
                Submitting will overwrite the previous entry.
            </p>
         </div>
      )}

      {/* Search and Bulk Actions */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <input
                type="text"
                placeholder="Search student..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={isClassSubmitted}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100 disabled:text-slate-400"
            />
        </div>
        <button
            onClick={markAllPresent}
            disabled={isClassSubmitted}
            className={`shrink-0 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-medium py-3 px-4 rounded-lg flex items-center justify-center transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                isMarkingAll ? 'scale-95 bg-emerald-300' : ''
            }`}
        >
            <CheckCircle className={`w-5 h-5 mr-2 ${isMarkingAll ? 'animate-ping' : ''}`} />
            Mark All Present
        </button>
      </div>

      {/* Student List */}
      <div className="space-y-4">
        {filteredStudents.map(student => {
            const record = records[student.id];
            if (!record) return null; 
            
            return (
                <div key={student.id} className={`bg-white p-4 rounded-xl shadow-sm border ${isClassSubmitted ? 'border-emerald-100 bg-emerald-50/10' : 'border-slate-100'}`}>
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <span className="inline-block bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded mb-1">Roll: {student.rollNumber}</span>
                            <h3 className="font-semibold text-slate-800">{student.name}</h3>
                        </div>
                        <button 
                            onClick={() => setReportingStudent({id: student.id, name: student.name})}
                            className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg flex items-center gap-1 text-xs font-bold transition-colors"
                            title="Report Disciplinary Issue"
                        >
                            <AlertTriangle className="w-4 h-4" />
                            Report
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex bg-slate-50 p-1 rounded-lg self-start">
                             <button
                                onClick={() => updateStatus(student.id, AttendanceStatus.PRESENT)}
                                disabled={isClassSubmitted}
                                className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors disabled:cursor-not-allowed ${
                                    record.status === AttendanceStatus.PRESENT ? 'bg-emerald-500 text-white shadow' : 'text-slate-500 hover:bg-slate-200'
                                }`}
                             >
                                <CheckCircle className="w-4 h-4 mr-1.5" /> Present
                             </button>
                             <button
                                onClick={() => updateStatus(student.id, AttendanceStatus.ABSENT)}
                                disabled={isClassSubmitted}
                                className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors disabled:cursor-not-allowed ${
                                    record.status === AttendanceStatus.ABSENT ? 'bg-rose-500 text-white shadow' : 'text-slate-500 hover:bg-slate-200'
                                }`}
                             >
                                <XCircle className="w-4 h-4 mr-1.5" /> Absent
                             </button>
                             <button
                                onClick={() => updateStatus(student.id, AttendanceStatus.LATE)}
                                disabled={isClassSubmitted}
                                className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors disabled:cursor-not-allowed ${
                                    record.status === AttendanceStatus.LATE ? 'bg-amber-500 text-white shadow' : 'text-slate-500 hover:bg-slate-200'
                                }`}
                             >
                                <Clock className="w-4 h-4 mr-1.5" /> Late
                             </button>
                        </div>

                        {(record.status === AttendanceStatus.ABSENT || record.status === AttendanceStatus.LATE) && (
                            <input
                                type="text"
                                placeholder={record.status === AttendanceStatus.LATE ? "Reason for late?" : "Reason for absence?"}
                                value={record.reason || ''}
                                disabled={isClassSubmitted}
                                onChange={(e) => updateReason(student.id, e.target.value)}
                                className="flex-1 p-2 border border-slate-300 rounded-md text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none disabled:bg-slate-100 disabled:text-slate-500"
                            />
                        )}
                    </div>
                </div>
            );
        })}
      </div>

      {/* Sticky Submit Button - CHANGES APPEARANCE BASED ON SUBMISSION */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur border-t border-slate-200 z-30">
        <div className="max-w-3xl mx-auto">
            {isClassSubmitted ? (
                <button
                    disabled
                    className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-200 flex items-center justify-center cursor-default animate-in fade-in duration-300"
                >
                    <CheckCircle className="w-6 h-6 mr-2" />
                    {isEditMode ? "Update Confirmed" : "Attendance Submitted Successfully"}
                </button>
            ) : (
                <button
                    onClick={handleSubmitAttendance}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-200 flex items-center justify-center transition-all active:scale-95"
                >
                    <Save className="w-5 h-5 mr-2" />
                    {isEditMode ? "Update Attendance Record" : `Submit Attendance (${total} Students)`}
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default TeacherView;