import { GoogleGenAI } from "@google/genai";
import { ClassAttendanceLog, AttendanceStatus, DisciplinaryRecord } from "../types";
import { getDisciplinaryRecordsForToday, getClasses } from "./storageService";

const getClassName = (id: string) => {
  const allClasses = getClasses();
  const c = allClasses.find(cls => cls.id === id);
  return c ? `${c.grade} - ${c.section}` : id;
};

export const generateDailyReport = async (logs: ClassAttendanceLog[]): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    // IMPORTANT: For HOS Report, only fetch escalated records
    const allDisciplinary = getDisciplinaryRecordsForToday();
    const escalatedRecords = allDisciplinary.filter(r => r.escalatedToHOS);

    // 1. Prepare data for the prompt
    let totalAbsentees = 0;
    let totalLate = 0;
    const notes: string[] = [];

    // Attendance Notes
    logs.forEach(log => {
      const className = getClassName(log.classId);
      log.records.forEach(r => {
        if (r.status === AttendanceStatus.ABSENT) {
          totalAbsentees++;
          if (r.reason) notes.push(`[Attendance] Class ${className} (${log.session}): Absent reason: "${r.reason}"`);
        }
        if (r.status === AttendanceStatus.LATE) {
          totalLate++;
          if (r.reason) notes.push(`[Attendance] Class ${className} (${log.session}): Late reason: "${r.reason}"`);
        }
      });
    });

    // Disciplinary Notes (ONLY ESCALATED)
    escalatedRecords.forEach(r => {
      notes.push(`[CRITICAL DISCIPLINARY INCIDENT] Student ${r.studentName} (${r.className}) reported by ${r.reportedBy}: "${r.description}"`);
    });

    if (notes.length === 0 && totalAbsentees === 0 && totalLate === 0) {
      return "All students are present today. No critical disciplinary issues reported. A smooth day.";
    }

    const dataContext = `
      Total Classes Logged: ${logs.length}.
      Total Absent: ${totalAbsentees}.
      Total Late: ${totalLate}.
      Total Critical Disciplinary Incidents (Escalated to HOS): ${escalatedRecords.length}.
      
      Specific Logs & Issues:
      ${notes.join('\n')}
    `;

    // 2. Call Gemini
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        You are an assistant to the Head of School (HOS). 
        Analyze the following daily attendance and disciplinary data for the MYP section.
        
        Data:
        ${dataContext}

        Please provide a professional, concise executive summary (max 3-4 sentences).
        
        Guidelines:
        1. Prioritize serious disciplinary incidents if any exist.
        2. Highlight patterns in attendance (e.g., "High lateness in MYP 4").
        3. If it's a calm day, say so briefly.
        
        Do not use markdown formatting like bold or lists, just a clean paragraph.
      `,
    });

    return response.text || "Unable to generate analysis.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "AI Service unavailable. Please check API Key configuration.";
  }
};