import { ClassAttendanceLog, DisciplinaryRecord, ClassSection, Student, SessionType } from '../types';
import { MYP_CLASSES } from '../constants';

const STORAGE_KEY = 'myp_prep_attendance_logs';
const DISC_STORAGE_KEY = 'myp_disciplinary_logs';
const CLASS_DATA_KEY = 'myp_class_data_v1';
const SETTINGS_KEY = 'myp_app_settings_v1';
const TIMETABLE_KEY = 'myp_prep_timetable_image_v1';
const TRUSTED_DEVICE_KEY = 'myp_prep_device_trusted_v1';

// --- Timetable Management ---

export const saveTimetableImage = (imageBase64: string): void => {
  try {
    localStorage.setItem(TIMETABLE_KEY, imageBase64);
  } catch (e) {
    console.error("Storage full or error", e);
    alert("Image too large for local browser storage. Please compress the image or try a smaller screenshot.");
  }
};

export const getTimetableImage = (): string | null => {
  return localStorage.getItem(TIMETABLE_KEY);
};

// --- App Settings (Session Locking & PINs) ---

export interface AppSettings {
  isMorningLocked: boolean;
  teacherAccessPin: string; // New field for protection
}

export const getAppSettings = (): AppSettings => {
  const stored = localStorage.getItem(SETTINGS_KEY);
  if (!stored) {
    // Default: Morning is LOCKED, Default PIN is 8899
    return { isMorningLocked: true, teacherAccessPin: '8899' };
  }
  try {
    const parsed = JSON.parse(stored);
    // Ensure backwards compatibility if pin missing
    if (!parsed.teacherAccessPin) parsed.teacherAccessPin = '8899';
    return parsed;
  } catch (e) {
    return { isMorningLocked: true, teacherAccessPin: '8899' };
  }
};

export const saveAppSettings = (settings: AppSettings): void => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

// --- Trusted Device Logic ---

export const isDeviceTrusted = (): boolean => {
    return localStorage.getItem(TRUSTED_DEVICE_KEY) === 'true';
};

export const trustDevice = (): void => {
    localStorage.setItem(TRUSTED_DEVICE_KEY, 'true');
};

export const untrustDevice = (): void => {
    localStorage.removeItem(TRUSTED_DEVICE_KEY);
};


// --- Class & Student Management (Dynamic Data) ---

export const getClasses = (): ClassSection[] => {
  const stored = localStorage.getItem(CLASS_DATA_KEY);
  if (!stored) {
    // Seed initial data from constants on first run
    localStorage.setItem(CLASS_DATA_KEY, JSON.stringify(MYP_CLASSES));
    return MYP_CLASSES;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error("Failed to parse class data", e);
    return MYP_CLASSES;
  }
};

export const addStudentToClass = (classId: string, name: string, rollNumber: number): void => {
  const classes = getClasses();
  const classIndex = classes.findIndex(c => c.id === classId);
  
  if (classIndex !== -1) {
    const newStudent: Student = {
      id: rollNumber.toString(), // Using roll number as ID for simplicity
      rollNumber: rollNumber,
      name: name.toUpperCase()
    };
    
    classes[classIndex].students.push(newStudent);
    // Sort by roll number
    classes[classIndex].students.sort((a, b) => a.rollNumber - b.rollNumber);
    
    localStorage.setItem(CLASS_DATA_KEY, JSON.stringify(classes));
  }
};

export const deleteStudentFromClass = (classId: string, studentId: string): void => {
  const classes = getClasses();
  const classIndex = classes.findIndex(c => c.id === classId);
  
  if (classIndex !== -1) {
    classes[classIndex].students = classes[classIndex].students.filter(s => s.id !== studentId);
    localStorage.setItem(CLASS_DATA_KEY, JSON.stringify(classes));
  }
};

// --- Attendance Logs ---

export const saveAttendanceLog = (log: ClassAttendanceLog): void => {
  const existingLogs = getAttendanceLogs();
  const today = new Date(log.timestamp).toLocaleDateString();
  
  // CRITICAL: Remove existing log for the same class + same day + same session to allow updates.
  // This ensures we never double count the same class.
  const filtered = existingLogs.filter(l => {
    const lDate = new Date(l.timestamp).toLocaleDateString();
    const isSameClass = l.classId === log.classId;
    const isSameDay = lDate === today;
    const isSameSession = l.session === log.session;
    
    // Return true to KEEP the log (if it's NOT the one we are replacing)
    // If all match, we filter it out (return false) so the new one replaces it.
    return !(isSameClass && isSameDay && isSameSession);
  });

  filtered.push(log);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

export const getAttendanceLogs = (): ClassAttendanceLog[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error("Failed to parse logs", e);
    return [];
  }
};

export const getLogsForToday = (): ClassAttendanceLog[] => {
  const logs = getAttendanceLogs();
  const today = new Date().toLocaleDateString();
  return logs.filter(l => new Date(l.timestamp).toLocaleDateString() === today);
};

// Helper to check if a record already exists (for Teacher View "Edit Mode")
export const getExistingLogForClass = (classId: string, session: SessionType): ClassAttendanceLog | undefined => {
  const logs = getLogsForToday();
  return logs.find(l => l.classId === classId && l.session === session);
};

export const getLogsByMonth = (monthIndex: number, year: number): ClassAttendanceLog[] => {
  const logs = getAttendanceLogs();
  return logs.filter(l => {
    const d = new Date(l.timestamp);
    return d.getMonth() === monthIndex && d.getFullYear() === year;
  });
};

export const clearAllData = () => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(DISC_STORAGE_KEY);
  localStorage.removeItem(CLASS_DATA_KEY);
  localStorage.removeItem(SETTINGS_KEY);
  localStorage.removeItem(TIMETABLE_KEY);
  localStorage.removeItem(TRUSTED_DEVICE_KEY);
};


// --- Disciplinary Records ---

export const saveDisciplinaryRecord = (record: DisciplinaryRecord): void => {
  const records = getDisciplinaryRecords();
  // Ensure default is false if not provided
  if (record.escalatedToHOS === undefined) {
    record.escalatedToHOS = false;
  }
  records.push(record);
  localStorage.setItem(DISC_STORAGE_KEY, JSON.stringify(records));
};

export const escalateDisciplinaryRecord = (id: string): void => {
  const records = getDisciplinaryRecords();
  const index = records.findIndex(r => r.id === id);
  if (index !== -1) {
    records[index].escalatedToHOS = true;
    localStorage.setItem(DISC_STORAGE_KEY, JSON.stringify(records));
  }
};

export const getDisciplinaryRecords = (): DisciplinaryRecord[] => {
  const stored = localStorage.getItem(DISC_STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error("Failed to parse disciplinary logs", e);
    return [];
  }
};

export const getDisciplinaryRecordsForToday = (): DisciplinaryRecord[] => {
  const records = getDisciplinaryRecords();
  const today = new Date().toLocaleDateString();
  return records.filter(r => new Date(r.timestamp).toLocaleDateString() === today);
};

// --- DATA BACKUP & ARCHIVAL ---

export const exportAllLogsToCSV = () => {
    const logs = getAttendanceLogs();
    const classes = getClasses();
    
    // Header
    let csvContent = "Date,Time,Session,Class,Teacher,Student Name,Roll No,Status,Reason\n";
    
    logs.forEach(log => {
        const cls = classes.find(c => c.id === log.classId);
        const className = cls ? `${cls.grade}-${cls.section}` : log.classId;
        const dateStr = new Date(log.timestamp).toLocaleDateString();
        const timeStr = new Date(log.timestamp).toLocaleTimeString();
        
        log.records.forEach(rec => {
            const student = cls?.students.find(s => s.id === rec.studentId);
            const studentName = student ? student.name : rec.studentId;
            const rollNo = student ? student.rollNumber : '';
            const reason = rec.reason ? `"${rec.reason.replace(/"/g, '""')}"` : ''; // Escape quotes
            
            csvContent += `${dateStr},${timeStr},${log.session},${className},"${log.teacherName}","${studentName}",${rollNo},${rec.status},${reason}\n`;
        });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `FULL_PREPX_ARCHIVE_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

export const createBackupData = () => {
    const backup = {
        logs: getAttendanceLogs(),
        disciplinary: getDisciplinaryRecords(),
        classes: getClasses(),
        settings: getAppSettings(),
        timestamp: new Date().toISOString()
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `PREPX_SYSTEM_BACKUP_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const factoryReset = () => {
    clearAllData();
    // Re-seed classes immediately so the app isn't broken
    getClasses(); 
    window.location.reload();
};
