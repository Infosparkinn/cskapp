import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  LogIn, 
  LogOut, 
  CheckCircle2, 
  Calendar, 
  AlertCircle,
  History
} from 'lucide-react';
import { dbService, getTodayDate, getCurrentTime } from '../../services/db';
import type { StaffAttendance, BranchId } from '../../types';

interface StaffAttendanceCardProps {
  staffId: string;
  staffName: string;
  branchId?: BranchId;
  onViewDetailedAttendance?: () => void;
}

export const StaffAttendanceCard: React.FC<StaffAttendanceCardProps> = ({ 
  staffId, 
  staffName, 
  branchId,
  onViewDetailedAttendance
}) => {
  const [currentTime, setCurrentTime] = useState(getCurrentTime());
  const [todayRecord, setTodayRecord] = useState<StaffAttendance | undefined>(() => 
    dbService.getStaffTodayAttendance(staffId)
  );
  const [historyList, setHistoryList] = useState<StaffAttendance[]>(() => 
    dbService.getStaffAttendance().filter(a => a.staffId === staffId)
  );
  const [showHistory, setShowHistory] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getCurrentTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleDbChange = () => {
      setTodayRecord(dbService.getStaffTodayAttendance(staffId));
      setHistoryList(dbService.getStaffAttendance().filter(a => a.staffId === staffId));
    };
    window.addEventListener('educenter-db-change', handleDbChange);
    return () => window.removeEventListener('educenter-db-change', handleDbChange);
  }, [staffId]);

  const handleCheckIn = () => {
    const record = dbService.staffCheckIn(staffId, staffName, branchId);
    setTodayRecord(record);
    setHistoryList(dbService.getStaffAttendance().filter(a => a.staffId === staffId));
    setMessage(`Checked in successfully at ${record.loginTime}!`);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleCheckOut = () => {
    const record = dbService.staffCheckOut(staffId);
    if (record) {
      setTodayRecord({ ...record });
      setHistoryList(dbService.getStaffAttendance().filter(a => a.staffId === staffId));
      setMessage(`Logged out successfully at ${record.logoutTime}!`);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Staff Attendance & Shift</h3>
            <p className="text-xs text-slate-400">{todayStr}</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-sm font-bold text-slate-800 font-mono tracking-tight">{currentTime}</span>
        </div>
      </div>

      {message && (
        <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Attendance Status Box */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        {/* Login Time */}
        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <LogIn className="w-3.5 h-3.5 text-emerald-600" />
            <span>Login Time</span>
          </div>
          <p className="text-base font-bold text-slate-900">
            {todayRecord ? todayRecord.loginTime : '--:--'}
          </p>
          <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            todayRecord ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
          }`}>
            {todayRecord ? 'Logged In' : 'Not Started'}
          </span>
        </div>

        {/* Logout Time */}
        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <LogOut className="w-3.5 h-3.5 text-amber-600" />
            <span>Logout Time</span>
          </div>
          <p className="text-base font-bold text-slate-900">
            {todayRecord?.logoutTime ? todayRecord.logoutTime : '--:--'}
          </p>
          <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            todayRecord?.logoutTime 
              ? 'bg-blue-100 text-blue-700' 
              : todayRecord 
                ? 'bg-amber-100 text-amber-700 animate-pulse' 
                : 'bg-slate-200 text-slate-600'
          }`}>
            {todayRecord?.logoutTime ? 'Shift Completed' : todayRecord ? 'In Progress' : 'Pending'}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex items-center gap-2">
        {!todayRecord ? (
          <button
            onClick={handleCheckIn}
            className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
          >
            <LogIn className="w-4 h-4" /> Check In (Login Time)
          </button>
        ) : !todayRecord.logoutTime ? (
          <button
            onClick={handleCheckOut}
            className="flex-1 py-3 px-4 bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-amber-600/20 transition-all"
          >
            <LogOut className="w-4 h-4" /> Check Out (Logout Time)
          </button>
        ) : (
          <div className="flex-1 py-2.5 px-4 bg-slate-100 text-slate-600 rounded-2xl text-xs font-medium text-center flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Today's Shift Logged
          </div>
        )}

        <button
          onClick={() => setShowHistory(!showHistory)}
          className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition-colors"
          title="Attendance History"
        >
          <History className="w-4 h-4" />
        </button>
      </div>

      {onViewDetailedAttendance && (
        <button
          onClick={onViewDetailedAttendance}
          className="w-full mt-3 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-blue-200/60"
        >
          <Calendar className="w-3.5 h-3.5" /> View Days Present & Permission Details ➔
        </button>
      )}

      {/* History Drawer */}
      {showHistory && (
        <div className="mt-4 pt-3 border-t border-slate-100">
          <p className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-blue-600" /> Past Attendance Logs
          </p>
          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {historyList.length === 0 ? (
              <p className="text-xs text-slate-400 py-2 text-center">No attendance records yet.</p>
            ) : (
              historyList.map(item => (
                <div key={item.id} className="p-2.5 bg-slate-50 rounded-xl text-xs flex items-center justify-between border border-slate-100">
                  <div>
                    <span className="font-semibold text-slate-800">{item.date}</span>
                    <p className="text-[11px] text-slate-500">
                      In: {item.loginTime} {item.logoutTime ? `• Out: ${item.logoutTime}` : '• Active'}
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 capitalize">
                    {item.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
