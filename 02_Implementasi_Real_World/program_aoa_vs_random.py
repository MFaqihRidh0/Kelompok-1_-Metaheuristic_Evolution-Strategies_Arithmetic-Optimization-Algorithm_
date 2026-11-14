#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
================================================================================
PROGRAM PENJADWALAN KOMPUTASI AWAN REAL-WORLD:
BASELINE RANDOM SCHEDULING (MINGGU 3) VS. ARITHMETIC OPTIMIZATION ALGORITHM (AOA)
================================================================================
Mata Kuliah : Strategi Optimasi Komputasi Awan
Kelompok    : 1
Dataset     : dataset_100cloudlet.csv s.d. dataset_500cloudlet.csv (Minggu 3)
Infrastruktur: 3 Datacenter (Surabaya, Jakarta, Yogyakarta) | 10 VM Heterogen
================================================================================
"""

import os
import csv
import math
import time
import random
from dataclasses import dataclass
from typing import List, Dict, Tuple, Optional

# ==============================================================================
# 1. SPESIFIKASI INFRASTRUKTUR DATACENTER & 10 VM HETEROGEN (MINGGU 3)
# ==============================================================================

@dataclass
class VM:
    id: int
    dc_name: str
    host_id: int
    vm_type: str
    mips: float
    pes: int
    ram_mb: int
    bw_mbps: float

    @property
    def total_mips(self) -> float:
        return self.mips * self.pes

    def execution_time(self, task_length_mi: float) -> float:
        return task_length_mi / self.total_mips


def build_datacenter_vms() -> List[VM]:
    """Membangun 10 VM Heterogen terbagi di 3 Datacenter sesuai tugas Minggu 3"""
    vms = []
    # DC Surabaya (Host 0) - Total Komputasi Terbesar
    vms.append(VM(0, "DC_Surabaya", 0, "Large",  3000.0, 2, 8192, 2500.0))  # 6.000 MIPS
    vms.append(VM(1, "DC_Surabaya", 0, "Large",  3000.0, 2, 8192, 2500.0))  # 6.000 MIPS
    vms.append(VM(2, "DC_Surabaya", 0, "Medium", 1800.0, 2, 4096, 1000.0))  # 3.600 MIPS

    # DC Jakarta (Host 1) - Komputasi Menengah
    vms.append(VM(3, "DC_Jakarta",  1, "Medium", 1800.0, 2, 4096, 1000.0))  # 3.600 MIPS
    vms.append(VM(4, "DC_Jakarta",  1, "Medium", 1800.0, 2, 4096, 1000.0))  # 3.600 MIPS
    vms.append(VM(5, "DC_Jakarta",  1, "Small",   800.0, 1, 2048,  500.0))  #   800 MIPS

    # DC Yogyakarta (Host 2) - Komputasi Ringan
    vms.append(VM(6, "DC_Yogyakarta", 2, "Small", 800.0, 1, 2048, 500.0))  #   800 MIPS
    vms.append(VM(7, "DC_Yogyakarta", 2, "Small", 800.0, 1, 2048, 500.0))  #   800 MIPS
    vms.append(VM(8, "DC_Yogyakarta", 2, "Small", 800.0, 1, 2048, 500.0))  #   800 MIPS
    vms.append(VM(9, "DC_Yogyakarta", 2, "Small", 800.0, 1, 2048, 500.0))  #   800 MIPS
    return vms


# Matriks Latensi Fisik Jaringan Antarkota Real-World (dalam detik)
NETWORK_LATENCY = {
    ("DC_Surabaya", "DC_Surabaya"):   0.001,  # Intra-DC 1.0 ms
    ("DC_Surabaya", "DC_Yogyakarta"): 0.008,  # Surabaya - Yogya 8.0 ms
    ("DC_Surabaya", "DC_Jakarta"):    0.015,  # Surabaya - Jakarta 15.0 ms
    ("DC_Jakarta",  "DC_Yogyakarta"): 0.010,  # Jakarta - Yogya 10.0 ms
}


# ==============================================================================
# 2. DATA MODEL & CSV PARSER UNTUK DATASET MINGGU 3
# ==============================================================================

@dataclass
class Cloudlet:
    id: int
    length_mi: float
    input_size_mb: float
    output_size_mb: float
    pes: int = 1


def load_dataset_csv(filepath: str) -> List[Cloudlet]:
    """Membaca berkas CSV dataset tugas Minggu 3"""
    cloudlets = []
    # Cek alternatif path jika file berada di folder datasets/
    if not os.path.exists(filepath):
        alt = os.path.join("datasets", os.path.basename(filepath))
        if os.path.exists(alt):
            filepath = alt

    with open(filepath, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            cid = int(row["CloudletId"])
            length = float(row["Length_MI"])
            inp = float(row["InputSize_MB"])
            out = float(row["OutputSize_MB"])
            pes = int(row.get("PEs", 1))
            cloudlets.append(Cloudlet(cid, length, inp, out, pes))
    return cloudlets


# ==============================================================================
# 3. DISPATCHER & EVALUATOR METRIK CLOUD
# ==============================================================================

@dataclass
class EvalResult:
    makespan: float
    throughput: float
    avg_utilization: float
    load_balancing_index: float  # LBI
    total_cost: float


def evaluate_schedule(schedule: List[int], cloudlets: List[Cloudlet], vms: List[VM]) -> EvalResult:
    num_vms = len(vms)
    vm_dict = {vm.id: vm for vm in vms}

    vm_tasks: Dict[int, List[Cloudlet]] = {vm.id: [] for vm in vms}
    for task_idx, vm_id in enumerate(schedule):
        vm_tasks[vm_id].append(cloudlets[task_idx])

    vm_finish_times = {vm.id: 0.0 for vm in vms}
    vm_busy_times = {vm.id: 0.0 for vm in vms}
    total_proc_cost = 0.0
    total_tx_cost = 0.0

    for vm_id, tasks in vm_tasks.items():
        vm = vm_dict[vm_id]
        current_clock = 0.0

        for task in tasks:
            # 1. Cek latensi ping fisik antarkota dari Surabaya ke DC VM
            lat = NETWORK_LATENCY.get(("DC_Surabaya", vm.dc_name), 0.01)
            # 2. Waktu transfer data I/O = (Ukuran MB / Bandwidth MBps) + Latensi Ping
            tx_time = (task.input_size_mb / (vm.bw_mbps / 8.0)) + lat

            # 3. Waktu mulai: tunggu sampai data tiba DAN VM selesai proses tugas sebelumnya
            start_time = max(current_clock, tx_time)
            # 4. Waktu komputasi murni CPU = Panjang Instruksi MI / MIPS VM
            exec_time = vm.execution_time(task.length_mi)
            # 5. Waktu selesai = Waktu mulai + Durasi eksekusi CPU
            finish_time = start_time + exec_time

            # 6. Geser jam antrean VM saat ini ke waktu selesai tugas
            current_clock = finish_time
            vm_busy_times[vm_id] += exec_time

            total_proc_cost += exec_time * 0.03
            total_tx_cost += (task.input_size_mb + task.output_size_mb) * 0.001

        vm_finish_times[vm_id] = current_clock

    makespan = max(vm_finish_times.values()) if vm_finish_times else 0.0
    throughput = len(cloudlets) / makespan if makespan > 0 else 0.0
    avg_util = (sum(vm_busy_times.values()) / (num_vms * makespan) * 100.0) if makespan > 0 else 0.0

    avg_busy = sum(vm_busy_times.values()) / num_vms if num_vms > 0 else 1.0
    max_busy = max(vm_busy_times.values()) if vm_busy_times else 0.0
    min_busy = min(vm_busy_times.values()) if vm_busy_times else 0.0
    lbi = (max_busy - min_busy) / avg_busy if avg_busy > 0 else 0.0

    total_cost = total_proc_cost + (makespan * 0.03 * num_vms * 0.1) + total_tx_cost

    return EvalResult(makespan, throughput, avg_util, lbi, total_cost)


# ==============================================================================
# 4. ALGORITMA PENJADWALAN
# ==============================================================================

def schedule_random(cloudlets: List[Cloudlet], vms: List[VM], seed: int) -> List[int]:
    """1. Random Scheduling (Baseline Minggu 3)"""
    rnd = random.Random(seed)
    return [rnd.randint(0, len(vms) - 1) for _ in cloudlets]


class AOAScheduler:
    """2. Arithmetic Optimization Algorithm (AOA) - Abualigah et al. (2021)"""
    def __init__(self, cloudlets: List[Cloudlet], vms: List[VM], pop_size: int = 30, max_iter: int = 50, seed: int = 42):
        self.cloudlets = cloudlets
        self.vms = vms
        self.num_tasks = len(cloudlets)
        self.num_vms = len(vms)
        self.pop_size = pop_size
        self.max_iter = max_iter
        self.alpha = 5.0
        self.mu_rate = 0.499
        self.rnd = random.Random(seed)

    def optimize(self) -> Tuple[List[int], EvalResult]:
        lb, ub = 0, self.num_vms - 1

        # 1. Inisialisasi Populasi Agen [pop_size x num_tasks]
        population = [[self.rnd.randint(lb, ub) for _ in range(self.num_tasks)] for _ in range(self.pop_size)]

        best_schedule = population[0]
        best_result = evaluate_schedule(best_schedule, self.cloudlets, self.vms)
        best_fitness = best_result.makespan

        for ind in population:
            res = evaluate_schedule(ind, self.cloudlets, self.vms)
            if res.makespan < best_fitness:
                best_fitness = res.makespan
                best_schedule = list(ind)
                best_result = res

        # 2. Siklus Iterasi AOA
        for t in range(1, self.max_iter + 1):
            # Math Optimizer Accelerated (MOA)
            moa = 0.2 + t * ((0.9 - 0.2) / self.max_iter)

            # Math Optimizer Probability (MOP)
            mop = 1.0 - (math.pow(t, 1.0 / self.alpha) / math.pow(self.max_iter, 1.0 / self.alpha))

            for i in range(self.pop_size):
                new_ind = list(population[i])

                for j in range(self.num_tasks):
                    r1, r2, r3 = self.rnd.random(), self.rnd.random(), self.rnd.random()
                    perturb = (ub - lb) * self.mu_rate * (self.rnd.random() - 0.5) * 2.0

                    if r1 > moa:
                        # Fase Eksplorasi: Pembagian (/) dan Perkalian (*)
                        if r2 < 0.5:
                            val = best_schedule[j] / (mop + 1e-5) * (1.0 + perturb * 0.1)
                        else:
                            val = best_schedule[j] * mop * (1.0 + perturb * 0.1)
                    else:
                        # Fase Eksploitasi: Pengurangan (-) dan Penambahan (+)
                        if r3 < 0.5:
                            val = best_schedule[j] - mop * perturb
                        else:
                            val = best_schedule[j] + mop * perturb

                    vm_idx = int(round(val))
                    vm_idx = max(lb, min(ub, vm_idx))
                    new_ind[j] = vm_idx

                res = evaluate_schedule(new_ind, self.cloudlets, self.vms)
                if res.makespan < best_fitness:
                    best_fitness = res.makespan
                    best_schedule = list(new_ind)
                    best_result = res

                population[i] = new_ind

        return best_schedule, best_result


# ==============================================================================
# 5. FUNGSI UTAMA & EKSEKUSI DATASET MINGGU 3
# ==============================================================================

def main():
    print("=" * 80)
    print("   PROGRAM PENJADWALAN CLOUD: RANDOM SCHEDULING VS AOA YANG BARU")
    print("   Infrastruktur: 3 Datacenter (Surabaya, Jakarta, Yogya) | 10 VM Heterogen")
    print("   Dataset: Menguji dataset_100cloudlet.csv s.d. dataset_500cloudlet.csv")
    print("=" * 80)

    vms = build_datacenter_vms()
    scenarios = [100, 200, 300, 400, 500]
    runs = 10

    summary_rows = []

    for n in scenarios:
        csv_file = f"dataset_{n}cloudlet.csv"
        if not os.path.exists(csv_file) and not os.path.exists(os.path.join("datasets", csv_file)):
            print(f"[WARN] File {csv_file} tidak ditemukan. Melewati skenario {n}.")
            continue

        cloudlets = load_dataset_csv(csv_file)
        print(f"\n>>> Memproses Skenario: {n} Cloudlets ({len(cloudlets)} tugas terbaca dari {csv_file})")

        # 1. Eksekusi Random Scheduling (10 runs)
        rnd_makespans, rnd_throughputs, rnd_utils, rnd_lbis, rnd_costs = [], [], [], [], []
        t0 = time.time()
        for r in range(1, runs + 1):
            sched = schedule_random(cloudlets, vms, seed=r)
            res = evaluate_schedule(sched, cloudlets, vms)
            rnd_makespans.append(res.makespan)
            rnd_throughputs.append(res.throughput)
            rnd_utils.append(res.avg_utilization)
            rnd_lbis.append(res.load_balancing_index)
            rnd_costs.append(res.total_cost)
        dur_rnd = time.time() - t0
        print(f"    [RANDOM] 10 Runs selesai dalam {dur_rnd:.2f}s | Avg Makespan: {sum(rnd_makespans)/runs:.2f}s | Avg LBI: {sum(rnd_lbis)/runs:.2f}")

        # 2. Eksekusi AOA yang Baru (10 runs)
        aoa_makespans, aoa_throughputs, aoa_utils, aoa_lbis, aoa_costs = [], [], [], [], []
        t0 = time.time()
        for r in range(1, runs + 1):
            aoa = AOAScheduler(cloudlets, vms, pop_size=30, max_iter=50, seed=r)
            best_sched, res = aoa.optimize()
            aoa_makespans.append(res.makespan)
            aoa_throughputs.append(res.throughput)
            aoa_utils.append(res.avg_utilization)
            aoa_lbis.append(res.load_balancing_index)
            aoa_costs.append(res.total_cost)
        dur_aoa = time.time() - t0
        print(f"    [AOA]    10 Runs selesai dalam {dur_aoa:.2f}s | Avg Makespan: {sum(aoa_makespans)/runs:.2f}s | Avg LBI: {sum(aoa_lbis)/runs:.2f}")

        # Hitung Persentase Perbaikan
        mean_rnd_ms = sum(rnd_makespans) / runs
        mean_aoa_ms = sum(aoa_makespans) / runs
        impr_ms = ((mean_rnd_ms - mean_aoa_ms) / mean_rnd_ms) * 100.0

        summary_rows.append({
            "Skenario": n,
            "Rnd_Makespan": f"{mean_rnd_ms:.2f}s",
            "AOA_Makespan": f"{mean_aoa_ms:.2f}s",
            "Peningkatan_Makespan": f"-{impr_ms:.1f}%",
            "Rnd_Throughput": f"{sum(rnd_throughputs)/runs:.2f} t/s",
            "AOA_Throughput": f"{sum(aoa_throughputs)/runs:.2f} t/s",
            "Rnd_LBI": f"{sum(rnd_lbis)/runs:.2f}",
            "AOA_LBI": f"{sum(aoa_lbis)/runs:.2f}",
            "Rnd_Cost": f"${sum(rnd_costs)/runs:.2f}",
            "AOA_Cost": f"${sum(aoa_costs)/runs:.2f}",
        })

    # Cetak Tabel Perbandingan Akhir
    print("\n" + "=" * 90)
    print("                    TABEL KOMPARASI AKHIR HASIL EKSEKUSI DATASET")
    print("=" * 90)
    header = f"{'Tasks':<8} | {'Makespan Random':<16} | {'Makespan AOA':<16} | {'Perbaikan (%)':<14} | {'LBI AOA':<8} | {'Hemat Biaya'}"
    print(header)
    print("-" * 90)
    for r in summary_rows:
        print(f"{r['Skenario']:<8} | {r['Rnd_Makespan']:<16} | {r['AOA_Makespan']:<16} | {r['Peningkatan_Makespan']:<14} | {r['AOA_LBI']:<8} | {r['AOA_Cost']}")
    print("=" * 90)

    # Simpan ke CSV
    out_csv = "hasil_program_aoa_vs_random.csv"
    with open(out_csv, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(summary_rows[0].keys()))
        writer.writeheader()
        writer.writerows(summary_rows)
    print(f"\n[OK] Ringkasan komparasi berhasil disimpan ke berkas: {out_csv}")


if __name__ == "__main__":
    main()

