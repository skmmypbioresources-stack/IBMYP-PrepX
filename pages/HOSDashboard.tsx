import React, { useEffect, useState } from 'react';
import { Briefcase, AlertTriangle, Users, BarChart3, Clock, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList, Cell } from 'recharts';
import { getLogsForToday, getDisciplinaryRecordsForToday, getClasses } from '../services/storageService';
import { ClassAttendanceLog, AttendanceStatus, DisciplinaryRecord, ClassSection } from '../types';

const HOSDashboard: React.FC = () => {
  const [logs, setLogs] = useState<ClassAttendanceLog[]>([]);
  const [discRecords, setDiscRecords] = useState<DisciplinaryRecord[]>([]);
  const [classes, setClasses] = useState<ClassSection[]>([]);

  useEffect(() => {
    // Load Classes
    setClasses(getClasses());
    
    setLogs(getLogsForToday());
    // STRICT FILTER: Only show escalated disciplinary records
    const allRecords = getDisciplinaryRecordsForToday();
    setDiscRecords(allRecords.filter(r => r.escalatedToHOS));
  }, []);

  // --- Data Processing for Chart ---
  const chartData = classes.map(cls => {
    // Find logs for this class today
    const classLogs = logs.filter(l => l.classId === cls.id);
    
    // Get latest log to represent current status
    const latestLog = classLogs.sort((a, b) => b.timestamp - a.timestamp)[0];

    const totalStrength = cls.students.length;
    let present = 0;
    let late = 0;
    let absent = 0;

    if (latestLog) {
      latestLog.records.forEach(r => {
        if (r.status === AttendanceStatus.PRESENT) present++;
        if (r.status === AttendanceStatus.LATE) late++;
        if (r.status === AttendanceStatus.ABSENT) absent++;
      });
    }

    const percentage = totalStrength > 0 ? (present / totalStrength) * 100 : 0;

    return {
      name: `${cls.grade}-${cls.section}`,
      TotalStrength: totalStrength,
      Present: present,
      Late: late,
      Absent: absent,
      percentage: percentage,
      hasData: !!latestLog,
      session: latestLog?.session
    };
  });

  // --- Data Processing for Issues Log ---
  
  // 1. Extract Late/Absent issues from Attendance Logs
  const attendanceIssues = logs.flatMap(log => {
    const className = classes.find(c => c.id === log.classId);
    const gradeSection = className ? `${className.grade}-${className.section}` : log.classId;
    
    return log.records
      .filter(r => r.status !== AttendanceStatus.PRESENT)
      .map(r => {
        const student = className?.students.find(s => s.id === r.studentId);
        return {
            id: r.studentId + log.id,
            studentName: student?.name || 'Unknown',
            className: gradeSection,
            type: r.status === AttendanceStatus.ABSENT ? 'Absent' : 'Late',
            reason: r.reason || 'No reason provided',
            teacher: log.teacherName,
            session: log.session,
            time: new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        };
      });
  });

  // 2. Map Explicit Disciplinary Records (Already Filtered for Escalation)
  const disciplinaryIssues = discRecords.map(r => ({
      id: r.id,
      studentName: r.studentName,
      className: r.className,
      type: 'Disciplinary',
      reason: r.description,
      teacher: r.reportedBy,
      session: 'Reported',
      time: new Date(r.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
  }));

  // 3. Combine and Sort
  const allIssues = [...attendanceIssues, ...disciplinaryIssues].sort((a, b) => {
      // Priority: Disciplinary > Absent > Late
      const priority = (type: string) => {
          if (type === 'Disciplinary') return 3;
          if (type === 'Absent') return 2;
          return 1;
      };
      return priority(b.type) - priority(a.type);
  });

  const totalIssues = allIssues.length;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8 pb-20 relative">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
        <div>
            <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                <Briefcase className="w-8 h-8 text-purple-600" />
                HOS Executive View
            </h1>
            <p className="text-slate-500 mt-2 text-lg">
                Real-time Prep Duty Analytics • {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
             <div className="flex-1 md:flex-none bg-purple-50 px-6 py-4 rounded-xl border border-purple-100 text-center shadow-sm">
                <div className="text-xs text-purple-600 uppercase font-bold tracking-wider mb-1">Classes Active</div>
                <div className="text-3xl font-extrabold text-purple-900">{logs.length}</div>
             </div>
             <div className="flex-1 md:flex-none bg-rose-50 px-6 py-4 rounded-xl border border-rose-100 text-center shadow-sm">
                <div className="text-xs text-rose-600 uppercase font-bold tracking-wider mb-1">Attention Req.</div>
                <div className="text-3xl font-extrabold text-rose-900">{totalIssues}</div>
             </div>
        </div>
      </div>

      {/* Main Chart Section */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-lg relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-indigo-500" />
                    Attendance Performance vs Capacity
                </h2>
                <p className="text-slate-400 text-sm mt-1">Smart indicators show class health based on attendance %</p>
            </div>
            
            {/* Legend */}
            <div className="flex items-center gap-4 text-xs font-medium text-slate-600 bg-slate-50 px-4 py-2 rounded-lg">
                <div className="flex items-center"><div className="w-3 h-3 bg-slate-300 rounded-sm mr-2"></div> Total Strength</div>
                <div className="flex items-center"><div className="w-3 h-3 bg-emerald-500 rounded-sm mr-2"></div> Good (>90%)</div>
                <div className="flex items-center"><div className="w-3 h-3 bg-amber-500 rounded-sm mr-2"></div> Fair (75-90%)</div>
                <div className="flex items-center"><div className="w-3 h-3 bg-rose-500 rounded-sm mr-2"></div> Low (&lt;75%)</div>
            </div>
        </div>
        
        <div className="h-[450px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 30, right: 10, left: 0, bottom: 5 }} barGap={0}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#64748b', fontSize: 12, fontWeight: 600}} 
                        dy={15} 
                    />
                    <YAxis hide />
                    <Tooltip 
                        cursor={{fill: '#f8fafc', opacity: 0.5}}
                        content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                    <div className="bg-white/95 backdrop-blur-sm p-4 border border-slate-200 shadow-xl rounded-xl text-sm min-w-[200px]">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="font-bold text-slate-900 text-lg">{label}</p>
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${data.percentage >= 90 ? 'bg-emerald-100 text-emerald-700' : data.percentage >= 75 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                                                {data.percentage.toFixed(0)}% Rate
                                            </span>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-slate-500">
                                                <span>Total Capacity</span>
                                                <span className="font-bold text-slate-800">{data.TotalStrength}</span>
                                            </div>
                                            <div className="h-px bg-slate-100 my-1"/>
                                            <div className="flex justify-between text-emerald-600">
                                                <span>Present</span>
                                                <span className="font-bold">{data.Present}</span>
                                            </div>
                                            <div className="flex justify-between text-amber-600">
                                                <span>Late</span>
                                                <span className="font-bold">{data.Late}</span>
                                            </div>
                                            <div className="flex justify-between text-rose-600">
                                                <span>Absent</span>
                                                <span className="font-bold">{data.Absent}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    
                    {/* Total Strength Bar (Background reference) */}
                    <Bar dataKey="TotalStrength" fill="#e2e8f0" radius={[6, 6, 0, 0]} barSize={24} animationDuration={1500}>
                        <LabelList 
                            dataKey="TotalStrength" 
                            position="top" 
                            style={{ fill: '#94a3b8', fontSize: '11px', fontWeight: 'bold' }} 
                            offset={8}
                        />
                    </Bar>

                    {/* Present Bar (Dynamic Color) */}
                    <Bar dataKey="Present" radius={[6, 6, 0, 0]} barSize={24} animationDuration={1500}>
                         <LabelList 
                            dataKey="Present" 
                            position="top" 
                            style={{ fill: '#334155', fontSize: '12px', fontWeight: '900' }} 
                            offset={8}
                        />
                        {chartData.map((entry, index) => (
                            <Cell 
                                key={`cell-${index}`} 
                                fill={
                                    entry.percentage >= 90 ? '#10b981' :  // Green
                                    entry.percentage >= 75 ? '#f59e0b' :  // Amber
                                    '#f43f5e'                             // Red
                                } 
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* Issues & Disciplinary Log */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden relative z-10">
        <div className="p-6 border-b border-slate-100 flex items-center gap-4">
             <div className="p-3 bg-rose-50 rounded-2xl">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
             </div>
             <div>
                 <h2 className="text-xl font-bold text-slate-900">Issues & Disciplinary Log</h2>
                 <p className="text-sm text-slate-500">Only critical incidents escalated by Coordinators are shown here.</p>
             </div>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-100">
                    <tr>
                        <th className="px-6 py-4 font-bold tracking-wider">Student Details</th>
                        <th className="px-6 py-4 font-bold tracking-wider">Type</th>
                        <th className="px-6 py-4 font-bold tracking-wider">Issue / Reason</th>
                        <th className="px-6 py-4 font-bold tracking-wider">Reported By</th>
                        <th className="px-6 py-4 font-bold tracking-wider">Time</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {allIssues.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="px-6 py-16 text-center text-slate-400 flex flex-col items-center justify-center">
                                <div className="bg-emerald-50 p-4 rounded-full mb-3">
                                    <CheckCircle className="w-8 h-8 text-emerald-500" />
                                </div>
                                <p className="text-lg font-medium text-slate-700">No Critical Issues</p>
                                <p className="text-sm">No escalated disciplinary incidents or absences marked today.</p>
                            </td>
                        </tr>
                    ) : (
                        allIssues.map((issue) => (
                            <tr key={issue.id} className={`hover:bg-slate-50/80 transition-colors group ${issue.type === 'Disciplinary' ? 'bg-red-50/30' : ''}`}>
                                <td className="px-6 py-4">
                                    <p className="font-bold text-slate-800">{issue.studentName}</p>
                                    <p className="text-xs font-medium text-slate-400 mt-0.5">{issue.className}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                                        issue.type === 'Disciplinary' 
                                        ? 'bg-red-100 text-red-700 border-red-200'
                                        : issue.type === 'Absent' 
                                            ? 'bg-rose-50 text-rose-700 border-rose-100' 
                                            : 'bg-amber-50 text-amber-700 border-amber-100'
                                    }`}>
                                        {issue.type === 'Disciplinary' && <AlertTriangle className="w-3 h-3 mr-1"/>}
                                        {issue.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-slate-700 font-medium italic relative">
                                        <span className="text-slate-300 absolute -left-2 -top-1">"</span>
                                        {issue.reason}
                                        <span className="text-slate-300 absolute -right-2 -top-1">"</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
                                            {issue.teacher.substring(0,2)}
                                        </div>
                                        <span className="text-slate-600 font-medium">{issue.teacher}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center text-slate-500 text-xs font-medium bg-slate-100 px-2 py-1 rounded-md w-fit">
                                        <Clock className="w-3 h-3 mr-1.5" />
                                        {issue.time}
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default HOSDashboard;