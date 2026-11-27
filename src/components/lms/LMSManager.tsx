import React, { useState } from 'react';
import { 
  BookOpen, 
  FileText, 
  Video, 
  Link as LinkIcon, 
  CheckCircle2, 
  Award, 
  Plus, 
  Search, 
  ExternalLink,
  Layers,
  GraduationCap
} from 'lucide-react';
import { dbService } from '../../services/db';

export const LMSManager: React.FC = () => {
  const courses = dbService.getCourses();
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || 'crs-1');
  const [activeTab, setActiveTab] = useState<'syllabus' | 'materials' | 'assignments'>('syllabus');

  const selectedCourse = courses.find(c => c.id === selectedCourseId);

  // Sample Syllabus Modules
  const SYLLABUS_MODULES = [
    {
      id: 'm1',
      title: 'Module 1: Core Fundamentals & Environment Setup',
      hours: '15 Hours',
      status: 'completed',
      topics: ['Introduction & Industry Trends', 'IDE Setup & Version Control (Git/GitHub)', 'Language Syntax & Data Types', 'Control Flow, Loops & Functions']
    },
    {
      id: 'm2',
      title: 'Module 2: Advanced Concepts & Object-Oriented Design',
      hours: '25 Hours',
      status: 'in_progress',
      topics: ['OOP Principles: Classes, Inheritance, Polymorphism', 'Memory Management & Data Structures', 'Exception Handling & File Operations', 'REST APIs & Network Communication']
    },
    {
      id: 'm3',
      title: 'Module 3: Full Stack Frameworks & Database Integration',
      hours: '30 Hours',
      status: 'upcoming',
      topics: ['Database Modeling (SQL / MongoDB)', 'Backend API Development', 'Authentication, JWT & Security', 'Frontend State Management']
    },
    {
      id: 'm4',
      title: 'Module 4: Real-time Industry Capstone Project',
      hours: '20 Hours',
      status: 'upcoming',
      topics: ['Architecture Blueprint', 'Agile Sprint Implementation', 'Unit Testing & Bug Fixing', 'Production Cloud Deployment & CI/CD']
    }
  ];

  // Sample Study Materials
  const MATERIALS = [
    { id: 'mat-1', title: 'Python & AI Complete Reference Cheat Sheet', type: 'pdf', size: '2.4 MB', date: '2026-11-10' },
    { id: 'mat-2', title: 'Full Stack MERN Architecture Lecture Video', type: 'video', size: '1080p Stream', date: '2026-11-15' },
    { id: 'mat-3', title: 'Data Structures & Algorithms Interview Codebase', type: 'link', size: 'GitHub Repo', date: '2026-11-18' },
    { id: 'mat-4', title: 'SQL & Database Optimization Lecture Notes', type: 'pdf', size: '1.8 MB', date: '2026-11-20' }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-200 font-extrabold text-[10px] tracking-wide uppercase border border-blue-400/30">
              LMS Learning Management
            </span>
            <span className="text-xs text-blue-200/80">• Academic Curriculum & Resources</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">Course Syllabus & Learning Portal</h2>
          <p className="text-xs text-blue-200/80 mt-1">
            Track modular syllabus progress, distribute study materials and lecture notes, and review student projects.
          </p>
        </div>

        {/* Course Dropdown */}
        <div className="bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20">
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="bg-transparent font-extrabold text-white text-xs focus:outline-hidden"
          >
            {courses.map(c => (
              <option key={c.id} value={c.id} className="text-slate-900 font-bold">{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs">
        <button
          onClick={() => setActiveTab('syllabus')}
          className={`py-2 px-4 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
            activeTab === 'syllabus' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" /> Syllabus & Curriculum
        </button>
        <button
          onClick={() => setActiveTab('materials')}
          className={`py-2 px-4 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
            activeTab === 'materials' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" /> Study Materials & PDFs
        </button>
      </div>

      {/* TAB 1: SYLLABUS */}
      {activeTab === 'syllabus' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">{selectedCourse?.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Duration: {selectedCourse?.duration} • Standard Program Fee: ₹{selectedCourse?.fee.toLocaleString('en-IN')}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Curriculum Completion</span>
              <span className="text-xl font-black text-emerald-600">45% Completed</span>
            </div>
          </div>

          <div className="space-y-3">
            {SYLLABUS_MODULES.map((mod, index) => (
              <div key={mod.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-extrabold flex items-center justify-center text-[11px]">
                      {index + 1}
                    </span>
                    <h4 className="font-black text-slate-900 text-sm">{mod.title}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-mono font-bold">{mod.hours}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      mod.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : mod.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {mod.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  {mod.topics.map((t, i) => (
                    <div key={i} className="flex items-center gap-2 text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${mod.status === 'completed' ? 'text-emerald-500' : 'text-slate-400'}`} />
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: MATERIALS */}
      {activeTab === 'materials' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {MATERIALS.map(mat => (
              <div key={mat.id} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
                    {mat.type === 'pdf' ? <FileText className="w-5 h-5" /> : mat.type === 'video' ? <Video className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-sm">{mat.title}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">{mat.size} • Published: {mat.date}</p>
                  </div>
                </div>
                <button
                  onClick={() => alert(`Opening resource: ${mat.title}`)}
                  className="py-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
