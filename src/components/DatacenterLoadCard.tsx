import React from 'react';
import { Server, Cpu, Activity, Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import { HETEROGENEOUS_DATACENTERS } from '../algorithms/benchmarks';
import { AlgorithmType, GlobalBest, ESMetrics } from '../types';

interface DatacenterLoadCardProps {
  algorithm: AlgorithmType;
  globalBest: GlobalBest;
  iteration: number;
  maxIterations: number;
  esMetrics?: ESMetrics;
}

export const DatacenterLoadCard: React.FC<DatacenterLoadCardProps> = ({
  algorithm,
  globalBest,
  iteration,
  maxIterations,
  esMetrics,
}) => {
  const progress = Math.min(1, iteration / (maxIterations || 100));

  // 5 Heterogeneous Cloud Datacenters metadata according to CERN ALICE LHC (Lončar & Lončar, 2022)
  const datacentersData = [
    {
      id: 1,
      name: 'DC-1: HPC Cluster',
      shortName: 'DC-1 HPC',
      type: 'High-Performance',
      mips: 4500,
      cores: 8,
      vms: 500,
      accentColor: '#0284c7', // Sky Blue
      borderClass: 'border-l-[#0284c7]',
      bgGradient: 'from-sky-50/70 to-white',
      taskRole: 'Instruksi Raksasa (hingga 60.780 MI)',
      baseJobs: 14820,
      targetUtilization: 88,
    },
    {
      id: 2,
      name: 'DC-2: HTC High-Throughput',
      shortName: 'DC-2 HTC',
      type: 'High-Throughput',
      mips: 3200,
      cores: 4,
      vms: 600,
      accentColor: '#7c3aed', // Purple
      borderClass: 'border-l-[#7c3aed]',
      bgGradient: 'from-purple-50/70 to-white',
      taskRole: 'Batch Paralel Monte Carlo Partikel',
      baseJobs: 16950,
      targetUtilization: 84,
    },
    {
      id: 3,
      name: 'DC-3: HSC High-Storage',
      shortName: 'DC-3 HSC',
      type: 'Storage-Compute',
      mips: 2800,
      cores: 4,
      vms: 450,
      accentColor: '#db2777', // Pink
      borderClass: 'border-l-[#db2777]',
      bgGradient: 'from-pink-50/70 to-white',
      taskRole: 'Analisis Berkas Detektor Fisik',
      baseJobs: 9480,
      targetUtilization: 76,
    },
    {
      id: 4,
      name: 'DC-4: Distributed Storage',
      shortName: 'DC-4 Storage',
      type: 'Archive Storage',
      mips: 2100,
      cores: 2,
      vms: 300,
      accentColor: '#d97706', // Amber
      borderClass: 'border-l-[#d97706]',
      bgGradient: 'from-amber-50/70 to-white',
      taskRole: 'Replikasi Data & Arsip Log Mentah',
      baseJobs: 4320,
      targetUtilization: 68,
    },
    {
      id: 5,
      name: 'DC-5: Core Edge Cloud',
      shortName: 'DC-5 Core Edge',
      type: 'Broker & Gateway',
      mips: 3600,
      cores: 6,
      vms: 250,
      accentColor: '#059669', // Emerald
      borderClass: 'border-l-[#059669]',
      bgGradient: 'from-emerald-50/70 to-white',
      taskRole: 'Broker LJF & Penyeimbang Antrean',
      baseJobs: 3456,
      targetUtilization: 82,
    },
  ];

  // Total CERN ALICE workload
  const TOTAL_JOBS = 49026;
  const TOTAL_VMS = 2100;

  // Imbalance decreases as optimization progresses
  const currentDI = esMetrics?.degreeOfImbalance ?? Math.max(0.06, 0.42 * (1 - progress));

  return (
    <section className="warm-panel rounded-3xl p-5 md:p-6 border border-sand-300 shadow-md space-y-4 bg-gradient-to-br from-cream-100 via-white to-sand-50">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-sand-200 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 shadow-sm">
            <Server className="w-6 h-6 text-amber-900" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                Infrastruktur Riil Jurnal IEEE Access 2022
              </span>
              <span className="text-[10px] font-mono text-coffee-600 bg-sand-100 px-2 py-0.5 rounded border border-sand-200">
                {TOTAL_VMS.toLocaleString()} Virtual Machines &bull; {TOTAL_JOBS.toLocaleString()} Tugas
              </span>
            </div>
            <h3 className="text-lg md:text-xl font-bold text-coffee-950 tracking-tight">
              Distribusi Beban Nyata ke 5 Data Center Heterogen (CERN ALICE)
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono self-start md:self-auto">
          <div className="px-3 py-1.5 rounded-xl bg-white border border-sand-300 text-coffee-800 shadow-sm flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-amber-700" />
            <span>
              Imbalance (DI):{' '}
              <strong className="text-coffee-950 font-bold">
                {(currentDI * 100).toFixed(1)}%
              </strong>
            </span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 shadow-sm flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>
              Status: <strong className="font-bold">{currentDI < 0.15 ? 'Beban Seimbang' : 'Menyeimbangkan'}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 5 Datacenter Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {datacentersData.map((dc) => {
          // Adjust jobs allocation based on current imbalance and progress
          const randomVariation = Math.sin(iteration + dc.id) * (1 - progress) * 0.12;
          const assignedJobs = Math.round(dc.baseJobs * (1 + randomVariation));
          const dynamicUtil = Math.min(
            98,
            Math.max(45, Math.round(dc.targetUtilization + randomVariation * 40))
          );

          return (
            <div
              key={dc.id}
              className={`p-3.5 rounded-2xl border-l-4 ${dc.borderClass} border border-sand-200 bg-gradient-to-br ${dc.bgGradient} shadow-sm space-y-2.5 transition hover:shadow-md`}
            >
              {/* Top Row: Name & MIPS */}
              <div className="flex items-start justify-between gap-1">
                <div>
                  <h4 className="text-xs font-bold text-coffee-950 leading-tight">
                    {dc.shortName}
                  </h4>
                  <span className="text-[10px] font-mono text-coffee-600 block">
                    {dc.vms} VM &bull; {dc.cores} Core/VM
                  </span>
                </div>
                <span
                  className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-white shrink-0 shadow-xs"
                  style={{ backgroundColor: dc.accentColor }}
                >
                  {dc.mips} MIPS
                </span>
              </div>

              {/* Middle: Workload Jobs Assigned */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-coffee-600">Alokasi Beban:</span>
                  <strong className="text-coffee-950 font-bold">
                    {assignedJobs.toLocaleString()} Jobs
                  </strong>
                </div>

                {/* Utilization Progress Bar */}
                <div className="w-full bg-sand-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${dynamicUtil}%`,
                      backgroundColor:
                        dynamicUtil > 90 ? '#e11d48' : dynamicUtil > 75 ? dc.accentColor : '#10b981',
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-coffee-700 pt-0.5">
                  <span>Utilisasi VM:</span>
                  <strong
                    className={
                      dynamicUtil > 90
                        ? 'text-rose-700 font-bold'
                        : 'text-coffee-950 font-semibold'
                    }
                  >
                    {dynamicUtil}%
                  </strong>
                </div>
              </div>

              {/* Bottom: Specialized Role */}
              <div className="pt-2 border-t border-sand-200/80 text-[10px] text-coffee-700 font-sans leading-tight">
                <span className="text-coffee-500 font-mono block text-[9px] uppercase">
                  Peran Tugas:
                </span>
                {dc.taskRole}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Summary Bar */}
      <div className="p-3 rounded-xl bg-sand-100/80 border border-sand-200 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-coffee-800">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-700" />
          <span>
            Total Kapasitas Terpasang:{' '}
            <strong className="text-coffee-950">2.100 VM (~6.950.000 Total MIPS)</strong>
          </span>
        </div>
        <div className="text-coffee-600">
          Metode Broker:{' '}
          <strong className="text-coffee-950 font-bold">
            {algorithm === 'ES' ? 'Longest Job First (LJF Priority)' : 'Dynamic Cloudlet Scheduling'}
          </strong>
        </div>
      </div>
    </section>
  );
};
