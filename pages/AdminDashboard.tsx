import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileText, RefreshCw, AlertCircle, TrendingUp, Users } from 'lucide-react';
import { getLogsForToday } from '../services/storageService';
import { generateDailyReport } from '../services/geminiService';
import { ClassAttendanceLog, AttendanceStatus } from '../types';
import { MYP_CLASSES } from '../constants';

const COLORS = ['#10b981', '#f59e0b', '#f43f5e']; // Green, Amber, Red

const AdminDashboard: React.FC = () => {
  const [logs, setLogs] = useState<ClassAttendanceLog[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setLogs(getLogsForToday());
  };

  const handleGenerateReport = async () => {
    if (logs.length === 0) return;
    setLoadingAI(true);
    const report = await generateDailyReport(logs);
    setAiReport(report);
    setLoadingAI(false);
  };

  // Process data for charts
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

  const classPerformance = logs.map(log => {
    const className = MYP_CLASSES.find(c => c.id === log.classId);
    const name = className ? `${className.grade}-${className.section}` : log.classId;
    
    let p = 0, a = 0, l = 0;
    log.records.forEach(r => {
      if (r.status === AttendanceStatus.PRESENT) p++;
      if (r.status === AttendanceStatus.ABSENT) a++;
      if (r.status === AttendanceStatus.LATE) l++;
    });

    return {
      name,
      Present: p,
      Absent: a,
      Late: l,
      total: p + a + l
    };
  });

  const totalLogsExpected = MYP_CLASSES.length;
  const progress = Math.round((logs.length / totalLogsExpected) * 100);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Coordinator & HOS Dashboard</h1>
          <p className="text-slate-500">Overview for {new Date().toLocaleDateString()}</p>
        </div>
        <button 
          onClick={refreshData}
          className="flex items-center px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Data
        </button>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
                <span className="text-slate-500 text-sm font-medium">Submission Status</span>
                <span className="text-xs font-bold px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">{logs.length}/{totalLogsExpected} Classes</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
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

      {/* AI Report Section */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center">
                <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center mr-3">
                   <span className="text-lg">✨</span>
                </div>
                HOS Daily Briefing
            </h2>
            <button 
                onClick={handleGenerateReport}
                disabled={loadingAI || logs.length === 0}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
            >
                {loadingAI ? 'Analyzing...' : 'Generate Report'}
            </button>
        </div>
        
        {aiReport ? (
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-slate-200 leading-relaxed animate-in fade-in duration-500">
                {aiReport}
            </div>
        ) : (
            <p className="text-slate-400 text-sm">
                {logs.length > 0 
                  ? "Click 'Generate Report' to get an AI-powered summary of today's attendance trends and anomalies."
                  : "Waiting for attendance submissions to generate report."}
            </p>
        )}
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
                        <Tooltip 
                            cursor={{fill: '#f8fafc'}}
                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                        />
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
                        <th className="px-6 py-3">Time</th>
                        <th className="px-6 py-3">Class</th>
                        <th className="px-6 py-3">Teacher</th>
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
                            const className = MYP_CLASSES.find(c => c.id === log.classId);
                            const p = log.records.filter(r => r.status === AttendanceStatus.PRESENT).length;
                            const a = log.records.filter(r => r.status === AttendanceStatus.ABSENT).length;
                            const l = log.records.filter(r => r.status === AttendanceStatus.LATE).length;
                            return (
                                <tr key={log.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                                    <td className="px-6 py-4">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                    <td className="px-6 py-4 font-medium text-slate-900">{className?.grade} - {className?.section}</td>
                                    <td className="px-6 py-4">{log.teacherName}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <span className="text-emerald-600 font-medium">P: {p}</span>
                                            <span className="text-rose-600 font-medium">A: {a}</span>
                                            <span className="text-amber-600 font-medium">L: {l}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button className="text-indigo-600 hover:text-indigo-800 font-medium">View Details</button>
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
  );
};

export default AdminDashboard;