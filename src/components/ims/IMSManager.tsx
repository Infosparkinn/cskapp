import React, { useState } from 'react';
import { 
  Package, 
  Monitor, 
  Book, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Search, 
  Building,
  Filter
} from 'lucide-react';
import { dbService } from '../../services/db';
import type { BranchId } from '../../types';

export const IMSManager: React.FC = () => {
  const branches = dbService.getBranches();
  const [selectedBranch, setSelectedBranch] = useState<BranchId | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'pc' | 'kits' | 'electronics'>('all');

  const INVENTORY_ITEMS = [
    { id: 'inv-1', name: 'High-Performance Coding PCs (i5 12th Gen, 16GB RAM, 512GB NVMe SSD)', category: 'pc', branchId: 'dadagapatty', totalQty: 25, workingQty: 24, maintenanceQty: 1, location: 'Lab 1 & Lab 2' },
    { id: 'inv-2', name: 'AI & Data Science Deep Learning Workstations (RTX 4060 GPU, 32GB RAM)', category: 'pc', branchId: 'new_bus_stand', totalQty: 10, workingQty: 10, maintenanceQty: 0, location: 'Advanced AI Lab' },
    { id: 'inv-3', name: 'Student Course Welcome Kits (Bags, Spiral Notebooks, ID Cards & Pens)', category: 'kits', branchId: 'dadagapatty', totalQty: 150, workingQty: 95, maintenanceQty: 0, location: 'Store Room' },
    { id: 'inv-4', name: 'Python & AI Printed Course Guidebooks (Volume 1 & 2)', category: 'kits', branchId: 'kondalampatty', totalQty: 100, workingQty: 40, maintenanceQty: 0, location: 'Library Shelf B' },
    { id: 'inv-5', name: 'Ceiling Mounted HD Projectors & Sound Systems', category: 'electronics', branchId: 'ammapet', totalQty: 4, workingQty: 4, maintenanceQty: 0, location: 'Lecture Hall 1-4' },
    { id: 'inv-6', name: 'Cisco 24-Port Gigabit Switches & Wi-Fi 6 Routers', category: 'electronics', branchId: 'new_bus_stand', totalQty: 6, workingQty: 6, maintenanceQty: 0, location: 'Server Rack' }
  ];

  const filteredItems = INVENTORY_ITEMS.filter(item => {
    if (selectedBranch !== 'all' && item.branchId !== selectedBranch) return false;
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-teal-950 via-slate-900 to-slate-950 text-white p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-teal-500/30 text-teal-200 font-extrabold text-[10px] tracking-wide uppercase border border-teal-400/30">
              IMS Inventory & Assets
            </span>
            <span className="text-xs text-teal-200/80">• Lab Hardware & Study Kits</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">Campus Lab Infrastructure & Materials</h2>
          <p className="text-xs text-teal-200/80 mt-1">
            Maintain asset registers for computer systems, servers, network switches, student welcome bags, and textbooks.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10">
          <span className="text-[10px] font-bold text-teal-300 uppercase block">Total Managed Lab PCs</span>
          <span className="text-2xl font-black text-white">35 Systems</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value as BranchId | 'all')}
              className="bg-transparent font-bold text-slate-800 focus:outline-hidden"
            >
              <option value="all">All Salem Campuses</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name} ({b.location})</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="bg-transparent font-bold text-slate-800 focus:outline-hidden"
            >
              <option value="all">All Categories</option>
              <option value="pc">Lab Computers & Workstations</option>
              <option value="kits">Student Kits & Books</option>
              <option value="electronics">Projectors & Routers</option>
            </select>
          </div>
        </div>

        <span className="font-bold text-slate-500">
          {filteredItems.length} Registered asset items
        </span>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredItems.map(item => {
          const branch = branches.find(b => b.id === item.branchId);

          return (
            <div key={item.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-3 text-xs">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-teal-50 text-teal-700">
                    {item.category === 'pc' ? <Monitor className="w-6 h-6" /> : item.category === 'kits' ? <Book className="w-6 h-6" /> : <Cpu className="w-6 h-6" />}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-sm leading-tight">{item.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Location: {item.location} • {branch ? branch.fullName : item.branchId}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-bold">Total Stock</span>
                  <span className="font-mono font-black text-slate-900 text-sm">{item.totalQty}</span>
                </div>
                <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100">
                  <span className="text-[10px] text-emerald-600 block font-bold">In Service</span>
                  <span className="font-mono font-black text-emerald-700 text-sm">{item.workingQty}</span>
                </div>
                <div className="p-2 rounded-xl bg-amber-50 border border-amber-100">
                  <span className="text-[10px] text-amber-700 block font-bold">Maintenance</span>
                  <span className="font-mono font-black text-amber-800 text-sm">{item.maintenanceQty}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
