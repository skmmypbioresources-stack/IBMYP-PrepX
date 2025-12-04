import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { RefreshCw, AlertCircle, TrendingUp, Users, Calendar, Download, PlusCircle, X, ShieldAlert, ArrowUpRight, CheckCircle, Loader2, Save, Trash2, UserPlus, Search, Settings, Lock, Unlock, Image as ImageIcon, UploadCloud, QrCode, Printer, Archive, Database, RefreshCcw, KeyRound, Clock, User, FileBarChart } from 'lucide-react';
import { getLogsForToday, getLogsByMonth, saveDisciplinaryRecord, getDisciplinaryRecordsForToday, escalateDisciplinaryRecord, getClasses, addStudentToClass, deleteStudentFromClass, getAppSettings, saveAppSettings, saveTimetableImage, getTimetableImage, createBackupData, exportAllLogsToCSV, factoryReset, getAttendanceLogs, getDisciplinaryRecords } from '../services/storageService';
import { ClassAttendanceLog, AttendanceStatus, DisciplinaryRecord, ClassSection, StudentAttendanceRecord } from '../types';

const COLORS = ['#10b981', '#f59e0b', '#f43f5e']; // Green, Amber, Red

const CoordinatorDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly' | 'students' | 'reports' | 'timetable' | 'settings' | 'qrcards'>('daily');
  const [logs, setLogs] = useState<ClassAttendanceLog[]>([]);
  const [disciplinaryLogs, setDisciplinaryLogs] = useState<DisciplinaryRecord[]>([]);
  const [classes, setClasses] = useState<ClassSection[]>([]);
  
  // Monthly View State
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedClassId, setSelectedClassId] = useState('');
  const [monthlyLogs, setMonthlyLogs] = useState<ClassAttendanceLog[]>([]);

  // Student Report State
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [reportClassId, setReportClassId] = useState('');
  const [reportStudentId, setReportStudentId] = useState('');

  // Disciplinary Modal State
  const [isLoggingIncident, setIsLoggingIncident] = useState(false);
  const [incidentClassId, setIncidentClassId] = useState('');
  const [incidentStudentId, setIncidentStudentId] = useState('');
  const [incidentReporter, setIncidentReporter] = useState('');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [isSavingIncident, setIsSavingIncident] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // View Details Modal State
  const [viewingLog, setViewingLog] = useState<ClassAttendanceLog | null>(null);

  // Escalation State
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Student Management State
  const [manageClassId, setManageClassId] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentRoll, setNewStudentRoll] = useState('');
  
  // Settings State
  const [isMorningLocked, setIsMorningLocked] = useState(true);
  const [teacherAccessPin, setTeacherAccessPin] = useState('8899');

  // Timetable State
  const [timetableImage, setTimetableImage] = useState<string | null>(null);

  useEffect(() => {
    // Load Classes first
    const clsList = getClasses();
    setClasses(clsList);
    if (clsList.length > 0) {
        if (!selectedClassId) setSelectedClassId(clsList[0].id);
        if (!incidentClassId) setIncidentClassId(clsList[0].id);
        if (!manageClassId) setManageClassId(clsList[0].id);
        if (!reportClassId) setReportClassId(clsList[0].id);
    }
    
    // Load Settings
    const settings = getAppSettings();
    setIsMorningLocked(settings.isMorningLocked);
    setTeacherAccessPin(settings.teacherAccessPin || '8899');
    
    // Load Timetable
    setTimetableImage(getTimetableImage());

  }, []);

  useEffect(() => {
    refreshDailyData();
    refreshMonthlyData();
  }, [selectedMonth, selectedYear, selectedClassId]);

  const refreshDailyData = () => {
    setLogs(getLogsForToday());
    setDisciplinaryLogs(getDisciplinaryRecordsForToday());
  };

  const refreshMonthlyData = () => {
    const mLogs = getLogsByMonth(selectedMonth, selectedYear);
    setMonthlyLogs(mLogs.filter(l => l.classId === selectedClassId));
  };

  const refreshClasses = () => {
      const updatedClasses = getClasses();
      setClasses(updatedClasses);
  };
  
  const toggleMorningLock = () => {
      const newState = !isMorningLocked;
      setIsMorningLocked(newState);
      const settings = getAppSettings();
      saveAppSettings({ ...settings, isMorningLocked: newState });
  };

  const updateTeacherPin = (newPin: string) => {
      setTeacherAccessPin(newPin);
      if (newPin.length === 4) {
          const settings = getAppSettings();
          saveAppSettings({ ...settings, teacherAccessPin: newPin });
      }
  };

  const handleAddStudent = () => {
      if (!newStudentName.trim() || !newStudentRoll.trim()) {
          alert("Please enter both Name and Roll Number");
          return;
      }
      addStudentToClass(manageClassId, newStudentName, parseInt(newStudentRoll));
      setNewStudentName('');
      setNewStudentRoll('');
      refreshClasses();
  };

  const handleDeleteStudent = (studentId: string) => {
      if (confirm("Are you sure you want to remove this student from the class list?")) {
          deleteStudentFromClass(manageClassId, studentId);
          refreshClasses();
      }
  };

  const handleTimetableUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            setTimetableImage(base64String);
            saveTimetableImage(base64String);
            alert("Timetable updated successfully!");
        };
        reader.readAsDataURL(file);
    }
  };

  const handleSaveIncident = () => {
    const cls = classes.find(c => c.id === incidentClassId);
    const student = cls?.students.find(s => s.id === incidentStudentId);
    
    if (!student || !cls || !incidentReporter.trim() || !incidentDescription.trim()) {
        alert("Please fill all fields.");
        return;
    }

    setIsSavingIncident(true);

    // Simulate network delay for effect
    setTimeout(() => {
        saveDisciplinaryRecord({
            id: Date.now().toString(),
            studentId: student.id,
            studentName: student.name,
            classId: cls.id,
            className: `${cls.grade} - ${cls.section}`,
            reportedBy: incidentReporter,
            description: incidentDescription,
            timestamp: Date.now(),
            escalatedToHOS: false
        });

        setIsSavingIncident(false);
        setSaveSuccess(true);

        // Close after success message
        setTimeout(() => {
            setSaveSuccess(false);
            setIsLoggingIncident(false);
            setIncidentDescription('');
            setIncidentReporter('');
            refreshDailyData();
        }, 1000);
    }, 600);
  };

  const handleEscalate = (id: string) => {
    // Immediate visual feedback
    setProcessingId(id);

    setTimeout(() => {
        escalateDisciplinaryRecord(id);
        refreshDailyData();
        setProcessingId(null);
    }, 600); // 600ms delay to show the "Sending" animation
  };

  const handlePrintQR = () => {
      window.print();
  };

  const handleFactoryReset = () => {
      if (confirm("DANGER: This will permanently DELETE ALL ATTENDANCE LOGS, DISCIPLINARY RECORDS, AND CUSTOM SETTINGS.\n\nAre you sure you want to perform a Factory Reset for the new academic year?")) {
          if (confirm("Please confirm one last time. Have you downloaded the CSV Archive first?")) {
              factoryReset();
          }
      }
  };

  // --- Daily Data Processing ---
  const totalStats = logs.reduce((acc, log) => {
    log.records.forEach(r => {
      if (r.status === AttendanceStatus.PRESENT) acc.present++;
      else if (r.status === AttendanceStatus.ABSENT) acc.absent++;
      else if (r.status === AttendanceStatus.LATE) acc.late++;
    });
    return acc;
  }, { present: 0, late: 0, absent: 0 });

  const pieData = [
    { name: 'Present', value: totalStats.present },
    { name: 'Late', value: totalStats.late },
    { name: 'Absent', value: totalStats.absent },
  ];

  const classPerformance = logs.reduce((acc, log) => {
    const className = classes.find(c => c.id === log.classId);
    const name = className ? `${className.grade}-${className.section}` : log.classId;
    
    let entry = acc.find(x => x.name === name);
    if (!entry) {
        entry = { name, Present: 0, Absent: 0, Late: 0 };
        acc.push(entry);
    }
    
    // Accumulate stats
    log.records.forEach(r => {
      if (r.status === AttendanceStatus.PRESENT) entry!.Present++;
      if (r.status === AttendanceStatus.ABSENT) entry!.Absent++;
      if (r.status === AttendanceStatus.LATE) entry!.Late++;
    });
    return acc;
  }, [] as any[]);

  const totalLogsExpected = classes.length * 2; // Morning + Evening
  const progress = Math.round((logs.length / totalLogsExpected) * 100);


  // --- Monthly Spreadsheet Export ---
  const handleExportCSV = () => {
    const currentClass = classes.find(c => c.id === selectedClassId);
    if (!currentClass) return;

    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    let csvContent = "Student Name,Roll Number";
    daysArray.forEach(day => {
        csvContent += `,${day}-Morning,${day}-Evening`;
    });
    csvContent += "\n";

    currentClass.students.forEach(student => {
        let row = `"${student.name}",${student.rollNumber}`;
        daysArray.forEach(day => {
             const dateStr = new Date(selectedYear, selectedMonth, day).toLocaleDateString();
             const morningLog = monthlyLogs.find(l => new Date(l.timestamp).toLocaleDateString() === dateStr && l.session === 'Morning');
             const eveningLog = monthlyLogs.find(l => new Date(l.timestamp).toLocaleDateString() === dateStr && l.session === 'Evening');

             const getStatusChar = (log: ClassAttendanceLog | undefined, studentId: string) => {
                 if (!log) return '-';
                 const rec = log.records.find(r => r.studentId === studentId);
                 if (!rec) return '-';
                 if (rec.status === AttendanceStatus.PRESENT) return 'P';
                 if (rec.status === AttendanceStatus.ABSENT) return 'A';
                 if (rec.status === AttendanceStatus.LATE) return 'L';
                 return '-';
             };

             row += `,${getStatusChar(morningLog, student.id)},${getStatusChar(eveningLog, student.id)}`;
        });
        csvContent += row + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Attendance_${currentClass.grade}_${currentClass.section}_${selectedMonth + 1}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStudentsForIncident = () => {
      const cls = classes.find(c => c.id === incidentClassId);
      return cls ? cls.students : [];
  };

  const getStudentsForManagement = () => {
      const cls = classes.find(c => c.id === manageClassId);
      return cls ? cls.students : [];
  };

  // --- Student Report Logic ---
  const getStudentsForReport = () => {
      const cls = classes.find(c => c.id === reportClassId);
      return cls ? cls.students : [];
  };

  const generateStudentReport = () => {
      if (!reportStudentId) return null;
      
      const allLogs = getAttendanceLogs(); // Get EVERYTHING
      const allDisc = getDisciplinaryRecords();

      // Filter by Year and Student
      const studentLogs = allLogs.filter(log => {
          const d = new Date(log.timestamp);
          return d.getFullYear() === reportYear && log.records.some(r => r.studentId === reportStudentId);
      });

      // Filter Disciplinary
      const studentDisc = allDisc.filter(r => {
          const d = new Date(r.timestamp);
          return d.getFullYear() === reportYear && r.studentId === reportStudentId;
      });

      // Calculate Stats
      let present = 0, absent = 0, late = 0;
      const history: {date: string, session: string, status: AttendanceStatus, reason: string, teacher: string}[] = [];

      studentLogs.forEach(log => {
          const rec = log.records.find(r => r.studentId === reportStudentId);
          if (rec) {
              if (rec.status === AttendanceStatus.PRESENT) present++;
              if (rec.status === AttendanceStatus.ABSENT) absent++;
              if (rec.status === AttendanceStatus.LATE) late++;

              if (rec.status !== AttendanceStatus.PRESENT) {
                  history.push({
                      date: new Date(log.timestamp).toLocaleDateString(),
                      session: log.session,
                      status: rec.status,
                      reason: rec.reason || '-',
                      teacher: log.teacherName
                  });
              }
          }
      });

      // Sort history by date desc
      history.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const total = present + absent + late;
      const attendancePct = total === 0 ? 0 : Math.round((present / total) * 100);

      const studentName = classes.find(c => c.id === reportClassId)?.students.find(s => s.id === reportStudentId)?.name || 'Unknown';

      return {
          name: studentName,
          stats: { present, absent, late, total, attendancePct },
          attendanceHistory: history,
          disciplinaryHistory: studentDisc.sort((a,b) => b.timestamp - a.timestamp)
      };
  };

  const studentReportData = generateStudentReport();


  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8 pb-20">
      
      {/* CSS for Printing QR Cards */}
      <style>{`
        @media print {
            body * {
                visibility: hidden;
            }
            #printable-qr-grid, #printable-qr-grid * {
                visibility: visible;
            }
            #printable-qr-grid {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                margin: 0;
                padding: 0;
                background: white;
                display: grid !important;
                grid-template-columns: repeat(3, 1fr) !important;
                gap: 1rem !important;
            }
            /* Print rules for Student Report */
            #student-report-print, #student-report-print * {
                visibility: visible;
            }
            #student-report-print {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                background: white;
            }
            .no-print-border {
                border: none !important;
                box-shadow: none !important;
            }
            .page-break-item {
                break-inside: avoid;
                page-break-inside: avoid;
            }
        }
      `}</style>

      {/* View Details Modal */}
      {viewingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 print:hidden">
            <div className="bg-white w-full max-w-2xl rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                    <div>
                         <h3 className="text-xl font-bold text-slate-900">
                             {classes.find(c => c.id === viewingLog.classId)?.grade} - {classes.find(c => c.id === viewingLog.classId)?.section}
                         </h3>
                         <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                             <Clock className="w-4 h-4" />
                             {new Date(viewingLog.timestamp).toLocaleTimeString()} 
                             <span className="mx-1">•</span>
                             <User className="w-4 h-4" />
                             {viewingLog.teacherName}
                             <span className="mx-1">•</span>
                             <span className={`px-2 py-0.5 rounded text-xs font-bold ${viewingLog.session === 'Morning' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                 {viewingLog.session} Prep
                             </span>
                         </div>
                    </div>
                    <button onClick={() => setViewingLog(null)} className="p-2 hover:bg-slate-100 rounded-full">
                        <X className="w-6 h-6 text-slate-500" />
                    </button>
                </div>
                
                <div className="space-y-6">
                    {/* Absentees Section */}
                    <div>
                        <h4 className="text-sm font-bold text-rose-600 uppercase tracking-wide mb-2 flex items-center gap-2">
                             <AlertCircle className="w-4 h-4" /> Absent Students
                        </h4>
                        <div className="bg-rose-50 rounded-xl border border-rose-100 overflow-hidden">
                            {viewingLog.records.filter(r => r.status === AttendanceStatus.ABSENT).length === 0 ? (
                                <div className="p-4 text-center text-rose-400 text-sm">No students absent.</div>
                            ) : (
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-rose-100/50 text-rose-800">
                                        <tr>
                                            <th className="px-4 py-2 font-bold">Student ID</th>
                                            <th className="px-4 py-2 font-bold">Name</th>
                                            <th className="px-4 py-2 font-bold">Reason Provided</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-rose-100">
                                        {viewingLog.records.filter(r => r.status === AttendanceStatus.ABSENT).map(r => {
                                            const student = classes.find(c => c.id === viewingLog.classId)?.students.find(s => s.id === r.studentId);
                                            return (
                                                <tr key={r.studentId}>
                                                    <td className="px-4 py-2 font-mono text-rose-700">{student?.rollNumber}</td>
                                                    <td className="px-4 py-2 font-medium text-slate-800">{student?.name}</td>
                                                    <td className="px-4 py-2 italic text-slate-600">"{r.reason}"</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {/* Late Section */}
                    <div>
                        <h4 className="text-sm font-bold text-amber-600 uppercase tracking-wide mb-2 flex items-center gap-2">
                             <Clock className="w-4 h-4" /> Late Arrivals
                        </h4>
                        <div className="bg-amber-50 rounded-xl border border-amber-100 overflow-hidden">
                            {viewingLog.records.filter(r => r.status === AttendanceStatus.LATE).length === 0 ? (
                                <div className="p-4 text-center text-amber-400 text-sm">No late arrivals.</div>
                            ) : (
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-amber-100/50 text-amber-800">
                                        <tr>
                                            <th className="px-4 py-2 font-bold">Student ID</th>
                                            <th className="px-4 py-2 font-bold">Name</th>
                                            <th className="px-4 py-2 font-bold">Reason Provided</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-amber-100">
                                        {viewingLog.records.filter(r => r.status === AttendanceStatus.LATE).map(r => {
                                            const student = classes.find(c => c.id === viewingLog.classId)?.students.find(s => s.id === r.studentId);
                                            return (
                                                <tr key={r.studentId}>
                                                    <td className="px-4 py-2 font-mono text-amber-700">{student?.rollNumber}</td>
                                                    <td className="px-4 py-2 font-medium text-slate-800">{student?.name}</td>
                                                    <td className="px-4 py-2 italic text-slate-600">"{r.reason}"</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                    
                    {/* Summary of Present */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                         <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Total Present</h4>
                         <div className="flex flex-wrap gap-2">
                             {viewingLog.records.filter(r => r.status === AttendanceStatus.PRESENT).map(r => {
                                 const student = classes.find(c => c.id === viewingLog.classId)?.students.find(s => s.id === r.studentId);
                                 return (
                                     <span key={r.studentId} className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-600">
                                         {student?.name}
                                     </span>
                                 )
                             })}
                         </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Incident Modal */}
      {isLoggingIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 print:hidden">
            <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <AlertCircle className="w-6 h-6 text-rose-600" />
                        Log Disciplinary Incident
                    </h3>
                    <button onClick={() => setIsLoggingIncident(false)} className="p-1 hover:bg-slate-100 rounded-full">
                        <X className="w-6 h-6 text-slate-500" />
                    </button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Select Class</label>
                        <select 
                            value={incidentClassId} 
                            onChange={(e) => {
                                setIncidentClassId(e.target.value);
                                setIncidentStudentId(''); 
                            }}
                            className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            {classes.map(c => <option key={c.id} value={c.id}>{c.grade} - {c.section}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Select Student</label>
                        <select 
                            value={incidentStudentId} 
                            onChange={(e) => setIncidentStudentId(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">-- Select Student --</option>
                            {getStudentsForIncident().map(s => <option key={s.id} value={s.id}>{s.name} ({s.rollNumber})</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Reported By</label>
                        <input 
                            type="text"
                            placeholder="Coordinator Name"
                            value={incidentReporter}
                            onChange={(e) => setIncidentReporter(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Issue Description</label>
                        <textarea
                            value={incidentDescription}
                            onChange={(e) => setIncidentDescription(e.target.value)}
                            placeholder="Describe the incident..."
                            className="w-full p-2 border border-slate-300 rounded-lg h-24 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                     <button 
                        onClick={() => setIsLoggingIncident(false)}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                        disabled={isSavingIncident || saveSuccess}
                     >
                        Cancel
                     </button>
                     <button 
                        onClick={handleSaveIncident}
                        disabled={isSavingIncident || saveSuccess}
                        className={`px-6 py-2 rounded-lg font-bold shadow-lg transition-all flex items-center gap-2 ${
                            saveSuccess 
                            ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200' 
                            : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200'
                        }`}
                     >
                        {isSavingIncident ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                            </>
                        ) : saveSuccess ? (
                            <>
                                <CheckCircle className="w-5 h-5 animate-bounce" /> Saved!
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" /> Save Record
                            </>
                        )}
                     </button>
                </div>
            </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">GSIS IBMYP - PrepX</h1>
          <p className="text-slate-500 font-medium flex items-center gap-2 mt-1">
            <Calendar className="w-4 h-4" />
            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
             <button 
                onClick={() => setIsLoggingIncident(true)}
                className="flex items-center px-4 py-2 bg-rose-600 text-white rounded-md shadow hover:bg-rose-700 transition-colors mr-2"
            >
                <PlusCircle className="w-4 h-4 mr-2" />
                Log Incident
            </button>
            <div className="flex bg-slate-100 p-1 rounded-lg">
                <button 
                    onClick={() => setActiveTab('daily')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'daily' ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    Daily
                </button>
                <button 
                    onClick={() => setActiveTab('monthly')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'monthly' ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    Monthly
                </button>
                 <button 
                    onClick={() => setActiveTab('reports')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${activeTab === 'reports' ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    <FileBarChart className="w-4 h-4" /> Reports
                </button>
                <button 
                    onClick={() => setActiveTab('students')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'students' ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    Students
                </button>
                 <button 
                    onClick={() => setActiveTab('timetable')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${activeTab === 'timetable' ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    <ImageIcon className="w-4 h-4" /> Timetable
                </button>
                 <button 
                    onClick={() => setActiveTab('qrcards')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${activeTab === 'qrcards' ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    <QrCode className="w-4 h-4" /> Cards
                </button>
                <button 
                    onClick={() => setActiveTab('settings')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${activeTab === 'settings' ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    <Settings className="w-4 h-4" />
                </button>
            </div>
        </div>
      </div>

      {activeTab === 'daily' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 print:hidden">
             
             {/* Incident Review Section */}
             <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-rose-50/50 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5 text-rose-600" />
                            Incident Review Queue
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">Review reported incidents and escalate serious matters to HOS.</p>
                    </div>
                    <span className="bg-white px-3 py-1 rounded-full text-xs font-bold text-slate-600 border border-slate-200 shadow-sm">
                        {disciplinaryLogs.length} Records Today
                    </span>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                            <tr>
                                <th className="px-6 py-3">Time</th>
                                <th className="px-6 py-3">Student</th>
                                <th className="px-6 py-3">Reported By</th>
                                <th className="px-6 py-3 w-1/3">Description</th>
                                <th className="px-6 py-3 text-center">Status</th>
                                <th className="px-6 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {disciplinaryLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                                        No disciplinary incidents reported today.
                                    </td>
                                </tr>
                            ) : (
                                disciplinaryLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 text-slate-500">
                                            {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-slate-800">{log.studentName}</p>
                                            <p className="text-xs text-slate-500">{log.className}</p>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 font-bold bg-indigo-50/50 px-2 rounded w-fit">{log.reportedBy}</td>
                                        <td className="px-6 py-4 italic text-slate-700">"{log.description}"</td>
                                        <td className="px-6 py-4 text-center">
                                            {log.escalatedToHOS ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                                    Escalated
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                                                    Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {!log.escalatedToHOS ? (
                                                <button 
                                                    onClick={() => handleEscalate(log.id)}
                                                    disabled={processingId === log.id}
                                                    className={`inline-flex items-center px-3 py-1.5 text-xs font-bold rounded transition-all active:scale-95 ${
                                                        processingId === log.id 
                                                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                                                        : 'text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 shadow-sm'
                                                    }`}
                                                >
                                                    {processingId === log.id ? (
                                                        <>
                                                            <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Sending...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ArrowUpRight className="w-3 h-3 mr-1" />
                                                            Escalate to HOS
                                                        </>
                                                    )}
                                                </button>
                                            ) : (
                                                <span className="text-xs text-emerald-600 font-bold flex items-center justify-end animate-in fade-in zoom-in duration-300">
                                                    <CheckCircle className="w-4 h-4 mr-1" /> Sent to HOS
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
             </div>

             {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-500 text-sm font-medium">Daily Submissions</span>
                        <span className="text-xs font-bold px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">{logs.length} / {totalLogsExpected}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5">
                        <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-sm font-medium mb-1">Total Present</p>
                        <p className="text-3xl font-bold text-emerald-600">{totalStats.present}</p>
                    </div>
                    <Users className="w-8 h-8 text-emerald-100" />
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-sm font-medium mb-1">Total Absent</p>
                        <p className="text-3xl font-bold text-rose-600">{totalStats.absent}</p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-rose-100" />
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-sm font-medium mb-1">Total Late</p>
                        <p className="text-3xl font-bold text-amber-600">{totalStats.late}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-amber-100" />
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-6">Class-wise Breakdown</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={classPerformance}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                <Tooltip cursor={{fill: '#f8fafc'}} />
                                <Legend wrapperStyle={{paddingTop: '20px'}} />
                                <Bar dataKey="Present" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                                <Bar dataKey="Late" stackId="a" fill="#f59e0b" />
                                <Bar dataKey="Absent" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-6">Overall Distribution</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

             {/* Detailed Logs Table */}
             <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800">Submission Logs</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-500">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                            <tr>
                                <th className="px-6 py-3">Last Updated</th>
                                <th className="px-6 py-3">Class</th>
                                <th className="px-6 py-3">Teacher On Duty</th>
                                <th className="px-6 py-3">Summary</th>
                                <th className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">No records found for today.</td>
                                </tr>
                            ) : (
                                logs.map(log => {
                                    const className = classes.find(c => c.id === log.classId);
                                    const p = log.records.filter(r => r.status === AttendanceStatus.PRESENT).length;
                                    const a = log.records.filter(r => r.status === AttendanceStatus.ABSENT).length;
                                    const l = log.records.filter(r => r.status === AttendanceStatus.LATE).length;
                                    return (
                                        <tr key={log.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                                            <td className="px-6 py-4">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                            <td className="px-6 py-4 font-medium text-slate-900">
                                                {className?.grade} - {className?.section}
                                                <div className="text-xs text-slate-400 font-normal">{log.session} Prep</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-bold bg-indigo-50 text-indigo-700 px-2 py-1 rounded">
                                                    {log.teacherName}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    <span className="text-emerald-600 font-medium">P: {p}</span>
                                                    <span className="text-rose-600 font-medium">A: {a}</span>
                                                    <span className="text-amber-600 font-medium">L: {l}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button 
                                                    onClick={() => setViewingLog(log)}
                                                    className="text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
             </div>
          </div>
      )}

      {activeTab === 'reports' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Report Controls (Hidden on Print) */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-end print:hidden">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
                    <select 
                        value={reportYear} 
                        onChange={(e) => setReportYear(Number(e.target.value))}
                        className="p-2 border border-slate-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value={2024}>2024</option>
                        <option value={2025}>2025</option>
                        <option value={2026}>2026</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Class</label>
                    <select 
                        value={reportClassId} 
                        onChange={(e) => {
                            setReportClassId(e.target.value);
                            setReportStudentId(''); // Reset student when class changes
                        }}
                        className="p-2 border border-slate-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        {classes.map(c => <option key={c.id} value={c.id}>{c.grade} - {c.section}</option>)}
                    </select>
                </div>
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Select Student</label>
                    <select 
                        value={reportStudentId} 
                        onChange={(e) => setReportStudentId(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">-- Choose Student --</option>
                        {getStudentsForReport().map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.rollNumber})</option>
                        ))}
                    </select>
                </div>
                <div>
                     <button 
                        onClick={() => window.print()}
                        disabled={!reportStudentId}
                        className="flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Printer className="w-4 h-4 mr-2" />
                        Print Report
                    </button>
                </div>
              </div>

              {/* Report Card View */}
              {studentReportData ? (
                  <div id="student-report-print" className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
                      {/* Header */}
                      <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
                          <div>
                              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-2">{studentReportData.name}</h2>
                              <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
                                  <span className="flex items-center gap-1"><User className="w-4 h-4"/> Student ID: {reportStudentId}</span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1"><Calendar className="w-4 h-4"/> Academic Year: {reportYear}</span>
                                  <span>•</span>
                                  <span className="text-indigo-600 font-bold">{classes.find(c => c.id === reportClassId)?.grade} - {classes.find(c => c.id === reportClassId)?.section}</span>
                              </div>
                          </div>
                          <div className="text-right">
                               <div className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">Attendance Rate</div>
                               <div className={`text-4xl font-black ${
                                   studentReportData.stats.attendancePct >= 90 ? 'text-emerald-600' :
                                   studentReportData.stats.attendancePct >= 75 ? 'text-amber-500' : 'text-rose-600'
                               }`}>
                                   {studentReportData.stats.attendancePct}%
                               </div>
                          </div>
                      </div>

                      <div className="p-8 grid md:grid-cols-3 gap-8">
                          
                          {/* Stats Column */}
                          <div className="md:col-span-1 space-y-6">
                              <div className="h-64 relative">
                                  <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={[
                                                    { name: 'Present', value: studentReportData.stats.present },
                                                    { name: 'Late', value: studentReportData.stats.late },
                                                    { name: 'Absent', value: studentReportData.stats.absent },
                                                ]}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                <Cell fill="#10b981" />
                                                <Cell fill="#f59e0b" />
                                                <Cell fill="#f43f5e" />
                                            </Pie>
                                            <Tooltip />
                                            <Legend verticalAlign="bottom" height={36}/>
                                        </PieChart>
                                  </ResponsiveContainer>
                                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                      <div className="text-center">
                                          <div className="text-2xl font-bold text-slate-800">{studentReportData.stats.total}</div>
                                          <div className="text-xs text-slate-500 uppercase">Sessions</div>
                                      </div>
                                  </div>
                              </div>
                              
                              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                                  <div className="flex justify-between items-center text-sm">
                                      <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"/> Present</span>
                                      <span className="font-bold text-emerald-700">{studentReportData.stats.present}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-sm">
                                      <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500"/> Late</span>
                                      <span className="font-bold text-amber-700">{studentReportData.stats.late}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-sm">
                                      <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-rose-500"/> Absent</span>
                                      <span className="font-bold text-rose-700">{studentReportData.stats.absent}</span>
                                  </div>
                              </div>
                          </div>

                          {/* Detailed Logs Column */}
                          <div className="md:col-span-2 space-y-8">
                              
                              {/* Attendance History */}
                              <div>
                                  <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                                      <Clock className="w-5 h-5 text-indigo-500" /> Attendance Anomalies (Late / Absent)
                                  </h3>
                                  
                                  {studentReportData.attendanceHistory.length === 0 ? (
                                      <div className="text-slate-400 italic text-sm p-4 bg-slate-50 rounded-lg text-center">
                                          Perfect attendance record! No absences or late arrivals recorded.
                                      </div>
                                  ) : (
                                      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                                          <table className="w-full text-sm text-left">
                                              <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                                                  <tr>
                                                      <th className="px-4 py-2">Date</th>
                                                      <th className="px-4 py-2">Session</th>
                                                      <th className="px-4 py-2">Status</th>
                                                      <th className="px-4 py-2">Reason</th>
                                                      <th className="px-4 py-2">Teacher</th>
                                                  </tr>
                                              </thead>
                                              <tbody className="divide-y divide-slate-100">
                                                  {studentReportData.attendanceHistory.map((rec, idx) => (
                                                      <tr key={idx} className="hover:bg-slate-50">
                                                          <td className="px-4 py-2 font-mono text-slate-600">{rec.date}</td>
                                                          <td className="px-4 py-2 text-slate-500 text-xs">{rec.session}</td>
                                                          <td className="px-4 py-2">
                                                              <span className={`px-2 py-0.5 rounded text-xs font-bold ${rec.status === 'Absent' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                                                                  {rec.status}
                                                              </span>
                                                          </td>
                                                          <td className="px-4 py-2 italic text-slate-700">"{rec.reason}"</td>
                                                          <td className="px-4 py-2 text-slate-500 text-xs">{rec.teacher}</td>
                                                      </tr>
                                                  ))}
                                              </tbody>
                                          </table>
                                      </div>
                                  )}
                              </div>

                              {/* Disciplinary History */}
                              <div>
                                  <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                                      <ShieldAlert className="w-5 h-5 text-rose-600" /> Disciplinary Incidents
                                  </h3>
                                  
                                  {studentReportData.disciplinaryHistory.length === 0 ? (
                                      <div className="text-slate-400 italic text-sm p-4 bg-slate-50 rounded-lg text-center">
                                          No disciplinary incidents recorded for this year.
                                      </div>
                                  ) : (
                                      <div className="space-y-3">
                                          {studentReportData.disciplinaryHistory.map((rec, idx) => (
                                              <div key={idx} className="bg-rose-50 border border-rose-100 p-4 rounded-lg">
                                                  <div className="flex justify-between items-start mb-2">
                                                      <span className="font-bold text-rose-800 text-sm flex items-center gap-2">
                                                          <AlertCircle className="w-4 h-4"/> Incident Report
                                                      </span>
                                                      <span className="text-xs text-rose-500 font-mono">
                                                          {new Date(rec.timestamp).toLocaleDateString()}
                                                      </span>
                                                  </div>
                                                  <p className="text-slate-700 text-sm italic mb-2">"{rec.description}"</p>
                                                  <div className="flex justify-between items-center text-xs text-slate-500">
                                                      <span>Reported by: <span className="font-bold">{rec.reportedBy}</span></span>
                                                      {rec.escalatedToHOS && (
                                                          <span className="bg-rose-200 text-rose-800 px-2 py-0.5 rounded font-bold">Escalated to HOS</span>
                                                      )}
                                                  </div>
                                              </div>
                                          ))}
                                      </div>
                                  )}
                              </div>

                          </div>
                      </div>
                  </div>
              ) : (
                  <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-12 text-center text-slate-400">
                      <FileBarChart className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">Select a student to view their full academic year report.</p>
                  </div>
              )}
          </div>
      )}

      {/* (Monthly and Students tabs remain the same...) */}
      
      {activeTab === 'monthly' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 print:hidden">
             {/* Controls */}
             <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-end">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
                    <select 
                        value={selectedYear} 
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="p-2 border border-slate-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value={2024}>2024</option>
                        <option value={2025}>2025</option>
                        <option value={2026}>2026</option>
                        <option value={2027}>2027</option>
                        <option value={2028}>2028</option>
                        <option value={2029}>2029</option>
                        <option value={2030}>2030</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Month</label>
                    <select 
                        value={selectedMonth} 
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        className="p-2 border border-slate-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        {Array.from({length: 12}, (_, i) => (
                            <option key={i} value={i}>{new Date(2000, i).toLocaleString('default', { month: 'long' })}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Class</label>
                    <select 
                        value={selectedClassId} 
                        onChange={(e) => setSelectedClassId(e.target.value)}
                        className="p-2 border border-slate-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        {classes.map(c => (
                            <option key={c.id} value={c.id}>{c.grade} - {c.section}</option>
                        ))}
                    </select>
                </div>
                <div className="ml-auto">
                    <button 
                        onClick={handleExportCSV}
                        className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                    </button>
                </div>
             </div>

             {/* Spreadsheet Grid */}
             <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-center border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="p-3 text-left font-bold text-slate-700 sticky left-0 bg-slate-50 z-10 w-48 border-r">Student</th>
                                {Array.from({ length: new Date(selectedYear, selectedMonth + 1, 0).getDate() }, (_, i) => i + 1).map(day => (
                                    <th key={day} className="p-2 min-w-[50px] font-medium text-slate-600 border-r">{day}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {classes.find(c => c.id === selectedClassId)?.students.map(student => (
                                <tr key={student.id} className="hover:bg-slate-50">
                                    <td className="p-3 text-left font-medium text-slate-900 sticky left-0 bg-white z-10 border-r">
                                        <div className="truncate w-40">{student.name}</div>
                                        <div className="text-[10px] text-slate-400">#{student.rollNumber}</div>
                                    </td>
                                    {Array.from({ length: new Date(selectedYear, selectedMonth + 1, 0).getDate() }, (_, i) => i + 1).map(day => {
                                        const dateStr = new Date(selectedYear, selectedMonth, day).toLocaleDateString();
                                        const morningLog = monthlyLogs.find(l => new Date(l.timestamp).toLocaleDateString() === dateStr && l.session === 'Morning');
                                        const eveningLog = monthlyLogs.find(l => new Date(l.timestamp).toLocaleDateString() === dateStr && l.session === 'Evening');
                                        
                                        const getStatus = (l: ClassAttendanceLog | undefined) => {
                                            if (!l) return null;
                                            return l.records.find(r => r.studentId === student.id)?.status;
                                        };

                                        const mStatus = getStatus(morningLog);
                                        const eStatus = getStatus(eveningLog);
                                        
                                        const renderDot = (status: AttendanceStatus | null | undefined) => {
                                            if (!status) return <div className="w-2 h-2 rounded-full bg-slate-200" title="No Record" />;
                                            if (status === AttendanceStatus.PRESENT) return <div className="w-2 h-2 rounded-full bg-emerald-500" title="Present" />;
                                            if (status === AttendanceStatus.ABSENT) return <div className="w-2 h-2 rounded-full bg-rose-500" title="Absent" />;
                                            if (status === AttendanceStatus.LATE) return <div className="w-2 h-2 rounded-full bg-amber-500" title="Late" />;
                                        };

                                        return (
                                            <td key={day} className="p-1 border-r h-12 align-middle">
                                                <div className="flex flex-col gap-1 items-center justify-center h-full">
                                                    {/* Morning Top, Evening Bottom */}
                                                    {renderDot(mStatus)}
                                                    {renderDot(eStatus)}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex gap-4 justify-end">
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"/> Present</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500"/> Absent</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"/> Late</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-200"/> No Data</div>
                    <div className="ml-4 pl-4 border-l border-slate-300">
                        Top Dot: Morning | Bottom Dot: Evening
                    </div>
                </div>
             </div>
          </div>
      )}

      {activeTab === 'students' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 print:hidden">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                      <div>
                          <h3 className="text-lg font-bold text-slate-900">Manage Student Lists</h3>
                          <p className="text-sm text-slate-500">Add or remove students from class lists.</p>
                      </div>
                      <div className="w-48">
                         <select 
                            value={manageClassId} 
                            onChange={(e) => setManageClassId(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            {classes.map(c => <option key={c.id} value={c.id}>{c.grade} - {c.section}</option>)}
                        </select>
                      </div>
                  </div>

                  {/* Add Student Form */}
                  <div className="p-6 bg-slate-50 border-b border-slate-200">
                      <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center">
                          <UserPlus className="w-4 h-4 mr-2" /> Add New Student
                      </h4>
                      <div className="flex flex-col md:flex-row gap-3">
                          <input 
                              type="number"
                              placeholder="Roll Number"
                              value={newStudentRoll}
                              onChange={(e) => setNewStudentRoll(e.target.value)}
                              className="w-full md:w-32 p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <input 
                              type="text"
                              placeholder="Student Name"
                              value={newStudentName}
                              onChange={(e) => setNewStudentName(e.target.value)}
                              className="flex-1 p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <button 
                              onClick={handleAddStudent}
                              className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                          >
                              Add Student
                          </button>
                      </div>
                  </div>

                  {/* Student List */}
                  <div className="max-h-[500px] overflow-y-auto">
                      <table className="w-full text-sm text-left">
                          <thead className="bg-slate-50 text-xs text-slate-500 uppercase sticky top-0 z-10">
                              <tr>
                                  <th className="px-6 py-3">Roll No.</th>
                                  <th className="px-6 py-3">Student Name</th>
                                  <th className="px-6 py-3 text-right">Actions</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                              {getStudentsForManagement().map((student) => (
                                  <tr key={student.id} className="hover:bg-slate-50 group">
                                      <td className="px-6 py-4 font-mono text-slate-600">{student.rollNumber}</td>
                                      <td className="px-6 py-4 font-bold text-slate-800">{student.name}</td>
                                      <td className="px-6 py-4 text-right">
                                          <button 
                                            onClick={() => handleDeleteStudent(student.id)}
                                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors"
                                            title="Remove Student"
                                          >
                                              <Trash2 className="w-4 h-4" />
                                          </button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'timetable' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 print:hidden">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100">
                      <h3 className="text-lg font-bold text-slate-900">Weekly Prep Timetable</h3>
                      <p className="text-sm text-slate-500">Upload a screenshot of the weekly timetable to display on the Home screen.</p>
                  </div>
                  <div className="p-8 flex flex-col items-center justify-center space-y-6">
                      
                      {/* Upload Box */}
                      <label className="w-full max-w-lg flex flex-col items-center px-4 py-8 bg-white text-blue rounded-xl shadow-lg tracking-wide uppercase border border-blue cursor-pointer hover:bg-slate-50 hover:border-indigo-400 transition-all border-dashed border-2 border-slate-300">
                          <UploadCloud className="w-10 h-10 text-indigo-500" />
                          <span className="mt-2 text-base leading-normal text-slate-600 font-bold">Select Timetable Image</span>
                          <span className="text-xs text-slate-400 mt-1">Supports: JPG, PNG, Screenshots</span>
                          <input type='file' className="hidden" accept="image/*" onChange={handleTimetableUpload} />
                      </label>

                      {/* Preview */}
                      {timetableImage && (
                          <div className="w-full max-w-2xl bg-slate-50 p-2 rounded-xl border border-slate-200">
                              <p className="text-xs font-bold text-slate-500 mb-2 uppercase text-center">Current Published Timetable</p>
                              <img src={timetableImage} alt="Prep Timetable" className="w-full h-auto rounded-lg shadow-sm" />
                          </div>
                      )}
                      
                      {!timetableImage && (
                          <div className="text-slate-400 italic text-sm">No timetable currently uploaded.</div>
                      )}

                  </div>
              </div>
          </div>
      )}

      {activeTab === 'qrcards' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden no-print-border">
                   <div className="p-6 border-b border-slate-100 flex justify-between items-center print:hidden">
                      <div>
                          <h3 className="text-lg font-bold text-slate-900">Class QR Cards</h3>
                          <p className="text-sm text-slate-500">Scan these with phone camera to launch app directly into class.</p>
                      </div>
                      <button 
                        onClick={handlePrintQR}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                          <Printer className="w-4 h-4" /> Print Cards
                      </button>
                  </div>
                  
                  <div id="printable-qr-grid" className="p-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 bg-white">
                      {classes.map(cls => (
                          <div key={cls.id} className="page-break-item flex flex-col items-center p-6 border-2 border-slate-900 rounded-xl bg-white text-center relative">
                              <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tighter">{cls.grade}</h3>
                              <div className="bg-slate-900 text-white px-4 py-1 rounded-full font-bold text-lg mb-4">
                                  SECTION {cls.section}
                              </div>
                              
                              {/* QR Code - Clean, No Overlay */}
                              <div className="mb-4">
                                <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&ecc=H&data=${encodeURIComponent(`${window.location.origin}${window.location.pathname}?classId=${cls.id}&creator=SKM`)}`} 
                                    alt={`${cls.grade}-${cls.section} QR`}
                                    className="w-40 h-40"
                                />
                              </div>
                              
                              <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">GSIS IBMYP - PrepX</p>
                              <p className="text-[10px] text-slate-400 mt-1 font-medium flex items-center justify-center gap-1">
                                 Scan to Enter Class <span className="text-slate-300">•</span> <span className="font-serif italic text-slate-600 font-bold">SKM</span>
                              </p>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}
      
      {activeTab === 'settings' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 print:hidden">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100">
                      <h3 className="text-lg font-bold text-slate-900">Application Settings</h3>
                      <p className="text-sm text-slate-500">Control global configurations for the app.</p>
                  </div>
                  <div className="p-6 space-y-6">
                      
                      {/* Morning Prep Lock Toggle */}
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 h-full">
                            <div>
                                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                    {isMorningLocked ? <Lock className="w-5 h-5 text-amber-500" /> : <Unlock className="w-5 h-5 text-emerald-500" />}
                                    Morning Prep Access
                                </h4>
                                <p className="text-sm text-slate-500 mt-1">
                                    {isMorningLocked 
                                        ? "Teachers cannot currently select Morning Prep." 
                                        : "Teachers can mark attendance for Morning Prep."}
                                </p>
                            </div>
                            
                            <button
                                onClick={toggleMorningLock}
                                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                                    !isMorningLocked ? 'bg-emerald-500' : 'bg-slate-300'
                                }`}
                            >
                                <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                                    !isMorningLocked ? 'translate-x-7' : 'translate-x-1'
                                }`} />
                            </button>
                        </div>

                        {/* Teacher PIN Setting */}
                         <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                             <div className="flex items-center gap-2 mb-2">
                                 <KeyRound className="w-5 h-5 text-blue-600" />
                                 <h4 className="font-bold text-slate-800">Teacher Access PIN</h4>
                             </div>
                             <p className="text-xs text-slate-500 mb-3">Required once per device to prevent student access.</p>
                             <div className="flex gap-2">
                                 <input 
                                    type="text" 
                                    value={teacherAccessPin}
                                    onChange={(e) => updateTeacherPin(e.target.value)}
                                    maxLength={4}
                                    className="w-24 text-center font-bold tracking-widest border border-slate-300 rounded-lg p-2"
                                 />
                                 <div className="text-xs text-slate-400 self-center">
                                     (4 Digits)
                                 </div>
                             </div>
                        </div>
                      </div>

                      {/* Data Management Section */}
                      <div className="mt-8 border-t border-slate-100 pt-6">
                          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">Data Management & Archival</h4>
                          
                          <div className="grid md:grid-cols-2 gap-4">
                              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                  <div className="flex items-center gap-3 mb-2">
                                      <div className="p-2 bg-emerald-100 rounded-lg">
                                          <Database className="w-5 h-5 text-emerald-600" />
                                      </div>
                                      <h5 className="font-bold text-slate-800">Raw Data Export (CSV)</h5>
                                  </div>
                                  <p className="text-xs text-slate-500 mb-4">Download a complete, flattened CSV record of every attendance entry marked this year.</p>
                                  <button 
                                    onClick={exportAllLogsToCSV}
                                    className="w-full py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm text-sm"
                                  >
                                    Download CSV Archive
                                  </button>
                              </div>

                              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                  <div className="flex items-center gap-3 mb-2">
                                      <div className="p-2 bg-indigo-100 rounded-lg">
                                          <Archive className="w-5 h-5 text-indigo-600" />
                                      </div>
                                      <h5 className="font-bold text-slate-800">System Backup (JSON)</h5>
                                  </div>
                                  <p className="text-xs text-slate-500 mb-4">Download a full system snapshot including settings, students, and logs for restoration.</p>
                                  <button 
                                    onClick={createBackupData}
                                    className="w-full py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm text-sm"
                                  >
                                    Download System Backup
                                  </button>
                              </div>
                          </div>
                      </div>

                      {/* Danger Zone */}
                      <div className="mt-8 border-t border-red-100 bg-red-50/50 p-6 rounded-xl">
                          <h4 className="text-sm font-bold text-rose-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                              <AlertCircle className="w-4 h-4" /> Danger Zone
                          </h4>
                          <p className="text-sm text-rose-600 mb-4">
                              Proceed with caution. These actions are destructive and cannot be undone.
                          </p>
                          <button 
                             onClick={handleFactoryReset}
                             className="px-4 py-2 bg-white border border-rose-200 text-rose-600 font-bold rounded-lg hover:bg-rose-600 hover:text-white transition-colors shadow-sm text-sm flex items-center gap-2"
                          >
                              <RefreshCcw className="w-4 h-4" />
                              Factory Reset (End of Year)
                          </button>
                      </div>

                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default CoordinatorDashboard;