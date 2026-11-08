#!/usr/bin/env python3
"""
================================================================================
OPTIMASI PENJADWALAN TUGAS KOMPUTASI AWAN HETEROGEN - IMPLEMENTASI REAL WORLD
================================================================================
Kelompok 1:
- Arithmetic Optimization Algorithm (AOA) - Laith Abualigah et al. (2021)
- Evolution Strategies (ES) with LJF - Petra Lončar & Paula Lončar (IEEE Access 2022)
- Baseline: Random Task Scheduling (Minggu 3)

Infrastruktur Datacenter:
- 3 Datacenter: DC_Surabaya, DC_Jakarta, DC_Yogyakarta
- 10 Virtual Machines heterogen (2 Large, 3 Medium, 5 Small)
- Dataset Ujicoba Minggu 3: 100, 200, 300, 400, 500 Cloudlets

Metrik Evaluasi:
1. Makespan (s)
2. Average Response Time (s)
3. Throughput (tasks/s)
4. Average VM Utilization (%)
5. Load Balancing Index (LBI) / Degree of Imbalance (DI)
6. Total Cost ($)
7. Failed Cloudlets
================================================================================
"""

import os
import sys
import math
import time
import random
import csv
from dataclasses import dataclass
from typing import List, Dict, Tuple, Optional

# ==============================================================================
# 1. STRUKTUR DATA: DATACENTER, VM, & CLOUDLET
# ==============================================================================

@dataclass
class VM:
    id: int
    name: str
    type_name: str     # 'Large', 'Medium', 'Small'
    dc_name: str       # 'DC_Surabaya', 'DC_Jakarta', 'DC_Yogyakarta'
    host_id: int
    vcpus: int
    mips_per_cpu: float
    total_mips: float
    ram_mb: int
    bw_mbps: int
    cost_per_sec: float = 0.03

    def execution_time(self, task_mi: float) -> float:
        """Menghitung waktu eksekusi tugas murni berdasarkan MIPS VM"""
        return task_mi / self.total_mips


@dataclass
class Cloudlet:
    id: int
    length_mi: float
    input_size_mb: float
    output_size_mb: float
    pes_required: int


# ==============================================================================
# 2. DEFINISI TOPOLOGI TUGAS MINGGU 3 (SURABAYA, JAKARTA, YOGYAKARTA)
# ==============================================================================

def create_datacenter_vms() -> List[VM]:
    """
    Membangun 10 VM heterogen sesuai tugas Minggu 3:
    - VM 0, 1 : Large  (2 vCPU, 3000 MIPS/core = 6000 MIPS, 8GB RAM, 2500 BW) -> DC_Surabaya (Host 0)
    - VM 2    : Medium (2 vCPU, 1800 MIPS/core = 3600 MIPS, 4GB RAM, 1000 BW) -> DC_Surabaya (Host 0)
    - VM 3, 4 : Medium (2 vCPU, 1800 MIPS/core = 3600 MIPS, 4GB RAM, 1000 BW) -> DC_Jakarta  (Host 1)
    - VM 5    : Small  (1 vCPU, 800 MIPS/core  = 800 MIPS,  2GB RAM,  500 BW) -> DC_Jakarta  (Host 1)
    - VM 6..9 : Small  (1 vCPU, 800 MIPS/core  = 800 MIPS,  2GB RAM,  500 BW) -> DC_Yogyakarta (Host 2)
    """
    vms = []
    
    # VM 0 & 1 (Large - Surabaya)
    for i in range(2):
        vms.append(VM(
            id=i, name=f"VM-{i}", type_name="Large", dc_name="DC_Surabaya",
            host_id=0, vcpus=2, mips_per_cpu=3000.0, total_mips=6000.0,
            ram_mb=8192, bw_mbps=2500, cost_per_sec=0.03
        ))
    
    # VM 2 (Medium - Surabaya)
    vms.append(VM(
        id=2, name="VM-2", type_name="Medium", dc_name="DC_Surabaya",
        host_id=0, vcpus=2, mips_per_cpu=1800.0, total_mips=3600.0,
        ram_mb=4096, bw_mbps=1000, cost_per_sec=0.03
    ))
    
    # VM 3 & 4 (Medium - Jakarta)
    for i in [3, 4]:
        vms.append(VM(
            id=i, name=f"VM-{i}", type_name="Medium", dc_name="DC_Jakarta",
            host_id=1, vcpus=2, mips_per_cpu=1800.0, total_mips=3600.0,
            ram_mb=4096, bw_mbps=1000, cost_per_sec=0.03
        ))
    
    # VM 5 (Small - Jakarta)
    vms.append(VM(
        id=5, name="VM-5", type_name="Small", dc_name="DC_Jakarta",
        host_id=1, vcpus=1, mips_per_cpu=800.0, total_mips=800.0,
        ram_mb=2048, bw_mbps=500, cost_per_sec=0.03
    ))
    
    # VM 6..9 (Small - Yogyakarta)
    for i in range(6, 10):
        vms.append(VM(
            id=i, name=f"VM-{i}", type_name="Small", dc_name="DC_Yogyakarta",
            host_id=2, vcpus=1, mips_per_cpu=800.0, total_mips=800.0,
            ram_mb=2048, bw_mbps=500, cost_per_sec=0.03
        ))
        
    return vms


# Matriks Latensi Jaringan Nyata Antar-Datacenter (detik)
NETWORK_LATENCY_MATRIX = {
    ("DC_Surabaya", "DC_Surabaya"): 0.001,
    ("DC_Surabaya", "DC_Jakarta"): 0.015,
    ("DC_Surabaya", "DC_Yogyakarta"): 0.008,
    ("DC_Jakarta", "DC_Surabaya"): 0.015,
    ("DC_Jakarta", "DC_Jakarta"): 0.001,
    ("DC_Jakarta", "DC_Yogyakarta"): 0.010,
    ("DC_Yogyakarta", "DC_Surabaya"): 0.008,
    ("DC_Yogyakarta", "DC_Jakarta"): 0.010,
    ("DC_Yogyakarta", "DC_Yogyakarta"): 0.001,
}

# ==============================================================================
# 3. PEMBACA DATASET MINGGU 3 (CSV PARSER)
# ==============================================================================

def load_cloudlets_from_csv(csv_path: str) -> List[Cloudlet]:
    """Membaca file CSV dataset tugas minggu 3"""
    cloudlets = []
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"File dataset tidak ditemukan: {csv_path}")
        
    with open(csv_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            cid = int(row["CloudletId"])
            length = float(row["Length_MI"])
            inp = float(row["InputSize_MB"])
            out = float(row["OutputSize_MB"])
            pes = int(row.get("PEs", 1))
            cloudlets.append(Cloudlet(id=cid, length_mi=length, input_size_mb=inp, output_size_mb=out, pes_required=pes))
            
    return cloudlets


# ==============================================================================
# 4. SIMULATOR REAL-WORLD DISPATCHER & EVALUASI METRIK
# ==============================================================================

@dataclass
class SimulationResult:
    makespan: float
    avg_response_time: float
    throughput: float
    avg_vm_utilization: float
    load_balancing_index: float  # Degree of Imbalance (DI)
    total_cost: float
    failed_cloudlets: int
    vm_loads: Dict[int, float]
    vm_task_counts: Dict[int, int]


def evaluate_schedule(
    schedule: List[int],  # schedule[i] = ID VM yang dialokasikan untuk task i
    cloudlets: List[Cloudlet],
    vms: List[VM],
    apply_ljf: bool = False
) -> SimulationResult:
    """
    Mengevaluasi jadwal alokasi tugas secara detail seperti CloudSim:
    - Menghitung waktu mulai, waktu transfer jaringan, waktu proses, waktu selesai
    - Menghitung Makespan = max(finish_time VM)
    - Menghitung Throughput = total_tasks / makespan
    - Menghitung LBI (Load Balancing Index / Degree of Imbalance)
    - Menghitung Total Cost ($)
    """
    num_vms = len(vms)
    vm_dict = {vm.id: vm for vm in vms}
    
    # Pengelompokan tugas per VM
    vm_tasks: Dict[int, List[Cloudlet]] = {vm.id: [] for vm in vms}
    for task_idx, vm_id in enumerate(schedule):
        vm_tasks[vm_id].append(cloudlets[task_idx])
        
    # Jika kebijakan LJF diaktifkan, urutkan tugas di antrean VM dari instruksi terbesar ke terkecil
    if apply_ljf:
        for vm_id in vm_tasks:
            vm_tasks[vm_id].sort(key=lambda c: c.length_mi, reverse=True)
            
    vm_finish_times = {vm.id: 0.0 for vm in vms}
    vm_busy_times = {vm.id: 0.0 for vm in vms}
    task_response_times = []
    
    total_processing_cost = 0.0
    total_transfer_cost = 0.0
    
    for vm_id, tasks in vm_tasks.items():
        vm = vm_dict[vm_id]
        current_clock = 0.0
        
        for task in tasks:
            # Transfer delay (Client asumsi di Surabaya)
            latency = NETWORK_LATENCY_MATRIX.get(("DC_Surabaya", vm.dc_name), 0.01)
            tx_transfer = (task.input_size_mb / (vm.bw_mbps / 8.0)) + latency
            
            # Waktu mulai eksekusi setelah tugas selesai ditransfer
            start_time = max(current_clock, tx_transfer)
            exec_time = vm.execution_time(task.length_mi)
            finish_time = start_time + exec_time
            
            response_time = finish_time  # Waktu respon dari t=0 hingga selesai
            task_response_times.append(response_time)
            
            current_clock = finish_time
            vm_busy_times[vm_id] += exec_time
            
            # Perhitungan Biaya Sesuai Minggu 3:
            # - Processing: $0.03 per second
            # - Memory: $0.05 per MB
            # - Bandwidth: $0.01 per MB
            total_processing_cost += exec_time * 0.03
            total_transfer_cost += (task.input_size_mb + task.output_size_mb) * 0.001
            
        vm_finish_times[vm_id] = current_clock

    makespan = max(vm_finish_times.values()) if vm_finish_times else 0.0
    avg_response = sum(task_response_times) / len(task_response_times) if task_response_times else 0.0
    throughput = len(cloudlets) / makespan if makespan > 0 else 0.0
    
    # Rata-rata Utilisasi VM (%)
    avg_util = (sum(vm_busy_times.values()) / (num_vms * makespan) * 100.0) if makespan > 0 else 0.0
    
    # Load Balancing Index (LBI) / Degree of Imbalance (DI)
    # DI = (T_max - T_min) / T_avg
    avg_vm_time = sum(vm_busy_times.values()) / num_vms if num_vms > 0 else 1.0
    max_vm_time = max(vm_busy_times.values()) if vm_busy_times else 0.0
    min_vm_time = min(vm_busy_times.values()) if vm_busy_times else 0.0
    lbi = (max_vm_time - min_vm_time) / avg_vm_time if avg_vm_time > 0 else 0.0
    
    # Total Cost = Processing Cost + Fixed VM allocation cost + Transfer
    total_cost = total_processing_cost + (makespan * 0.03 * num_vms * 0.1) + total_transfer_cost
    
    vm_counts = {vm_id: len(tasks) for vm_id, tasks in vm_tasks.items()}
    
    return SimulationResult(
        makespan=makespan,
        avg_response_time=avg_response,
        throughput=throughput,
        avg_vm_utilization=avg_util,
        load_balancing_index=lbi,
        total_cost=total_cost,
        failed_cloudlets=0,
        vm_loads=vm_busy_times,
        vm_task_counts=vm_counts
    )


# ==============================================================================
# 5. ALGORITMA PENJADWALAN KOMPUTASI AWAN
# ==============================================================================

# ------------------------------------------------------------------------------
# 5A. RANDOM SCHEDULING (BASELINE MINGGU 3)
# ------------------------------------------------------------------------------
def schedule_random(cloudlets: List[Cloudlet], vms: List[VM], seed: int) -> List[int]:
    """Jadwal acak murni sesuai Tugas Minggu 3"""
    rnd = random.Random(seed)
    num_vms = len(vms)
    return [rnd.randint(0, num_vms - 1) for _ in cloudlets]


# ------------------------------------------------------------------------------
# 5B. ARITHMETIC OPTIMIZATION ALGORITHM (AOA) - Abualigah et al. (2021)
# ------------------------------------------------------------------------------
class AOAScheduler:
    def __init__(
        self,
        cloudlets: List[Cloudlet],
        vms: List[VM],
        pop_size: int = 30,
        max_iter: int = 60,
        alpha: float = 5.0,
        mu_rate: float = 0.499,
        seed: Optional[int] = None
    ):
        self.cloudlets = cloudlets
        self.vms = vms
        self.num_tasks = len(cloudlets)
        self.num_vms = len(vms)
        self.pop_size = pop_size
        self.max_iter = max_iter
        self.alpha = alpha
        self.mu_rate = mu_rate
        self.rnd = random.Random(seed)

    def optimize(self) -> Tuple[List[int], SimulationResult]:
        """Eksekusi optimasi AOA: Pembagian, Perkalian, Pengurangan, Penambahan"""
        lb, ub = 0, self.num_vms - 1
        
        # 1. Inisialisasi Populasi Agen [pop_size x num_tasks]
        population = []
        for _ in range(self.pop_size):
            individual = [self.rnd.randint(lb, ub) for _ in range(self.num_tasks)]
            population.append(individual)
            
        # Evaluasi awal
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
            # Hitung MOA (Math Optimizer Accelerated)
            moa = 0.2 + t * ((0.9 - 0.2) / self.max_iter)
            
            # Hitung MOP (Math Optimizer Probability)
            mop = 1.0 - (math.pow(t, 1.0 / self.alpha) / math.pow(self.max_iter, 1.0 / self.alpha))
            
            for i in range(self.pop_size):
                new_ind = list(population[i])
                
                for j in range(self.num_tasks):
                    r1 = self.rnd.random()
                    r2 = self.rnd.random()
                    r3 = self.rnd.random()
                    
                    # Perturbasi terdistribusi
                    perturb = (ub - lb) * self.mu_rate * (self.rnd.random() - 0.5) * 2.0
                    
                    if r1 > moa:
                        # FASE EKSPLORASI: Pembagian (/) dan Perkalian (*)
                        if r2 < 0.5:
                            # Pembagian (Melompat jauh)
                            val = best_schedule[j] / (mop + 1e-5) * (1.0 + perturb * 0.1)
                        else:
                            # Perkalian (Sebaran luas)
                            val = best_schedule[j] * mop * (1.0 + perturb * 0.1)
                    else:
                        # FASE EKSPLOITASI: Pengurangan (-) dan Penambahan (+)
                        if r3 < 0.5:
                            # Pengurangan (Menyisir rapat)
                            val = best_schedule[j] - mop * perturb
                        else:
                            # Penambahan (Menyisir rapat)
                            val = best_schedule[j] + mop * perturb
                            
                    # Batasi koordinat dan bulatkan ke indeks VM valid
                    vm_idx = int(round(val))
                    vm_idx = max(lb, min(ub, vm_idx))
                    new_ind[j] = vm_idx
                    
                # Evaluasi agen baru
                res = evaluate_schedule(new_ind, self.cloudlets, self.vms)
                if res.makespan < best_fitness:
                    best_fitness = res.makespan
                    best_schedule = list(new_ind)
                    best_result = res
                    
                population[i] = new_ind
                
        return best_schedule, best_result


# ------------------------------------------------------------------------------
# 5C. EVOLUTION STRATEGIES (ES) DENGAN LJF - Lončar & Lončar (IEEE Access 2022)
# ------------------------------------------------------------------------------
class ESScheduler:
    def __init__(
        self,
        cloudlets: List[Cloudlet],
        vms: List[VM],
        mu: int = 5,
        ratio: int = 7,         # Rasio optimal 1:7 (Lončar & Lončar, 2022)
        mutation_rate: float = 0.10, # ~10% Random Resetting Mutation
        max_generations: int = 60,
        seed: Optional[int] = None
    ):
        self.cloudlets = cloudlets
        self.vms = vms
        self.num_tasks = len(cloudlets)
        self.num_vms = len(vms)
        self.mu = mu
        self.lambda_offspring = mu * ratio
        self.mutation_rate = mutation_rate
        self.max_generations = max_generations
        self.rnd = random.Random(seed)

    def optimize(self) -> Tuple[List[int], SimulationResult]:
        """Eksekusi optimasi (mu, lambda)-ES dengan LJF dan Elitisme"""
        lb, ub = 0, self.num_vms - 1
        
        # 1. Inisialisasi Populasi Induk (mu)
        parents = []
        for _ in range(self.mu):
            individual = [self.rnd.randint(lb, ub) for _ in range(self.num_tasks)]
            parents.append(individual)
            
        best_schedule = list(parents[0])
        best_result = evaluate_schedule(best_schedule, self.cloudlets, self.vms, apply_ljf=True)
        best_fitness = best_result.makespan
        
        # 2. Siklus Generasi ES
        for gen in range(1, self.max_generations + 1):
            offspring_list = []
            
            # Reproduksi: setiap induk melahirkan (ratio) anak dengan mutasi acak
            for i in range(self.lambda_offspring):
                parent = parents[i % self.mu]
                child = list(parent)
                
                # Random Resetting Mutation: ~10% tugas dialihkan ke VM lain secara acak
                for j in range(self.num_tasks):
                    if self.rnd.random() < self.mutation_rate:
                        child[j] = self.rnd.randint(lb, ub)
                        
                # Evaluasi anak dengan kebijakan broker LJF
                res = evaluate_schedule(child, self.cloudlets, self.vms, apply_ljf=True)
                offspring_list.append((child, res))
                
                # Pembaruan Elitisme S_best
                if res.makespan < best_fitness:
                    best_fitness = res.makespan
                    best_schedule = list(child)
                    best_result = res
                    
            # 3. Seleksi Alam (mu, lambda): Hanya mu anak tercepat yang bertahan hidup
            offspring_list.sort(key=lambda item: item[1].makespan)
            parents = [item[0] for item in offspring_list[:self.mu]]
            
            # Elitisme: lindungi S_best di posisi induk pertama
            parents[0] = list(best_schedule)
            
        return best_schedule, best_result


# ==============================================================================
# 6. RUNNER UJICOBA LENGKAP DENGAN DATASET MINGGU 3 (100 - 500 CLOUDLETS)
# ==============================================================================

def run_benchmarks(datasets_dir: str, output_dir: str, num_runs: int = 10):
    """
    Menjalankan eksperimen komparasi komprehensif:
    Random vs AOA vs ES pada 5 skenario (100, 200, 300, 400, 500 Cloudlets)
    dengan 10 run per skenario.
    """
    scenarios = [100, 200, 300, 400, 500]
    algorithms = ["Random", "AOA", "ES_LJF"]
    vms = create_datacenter_vms()
    
    os.makedirs(output_dir, exist_ok=True)
    per_run_csv = os.path.join(output_dir, "hasil_real_world_per_run.csv")
    summary_csv = os.path.join(output_dir, "hasil_real_world_ringkasan.csv")
    
    print("\n" + "=" * 80)
    print("   MEMULAI UJICOBA OPTIMASI KOMPUTASI AWAN REAL-WORLD")
    print(f"   Infrastruktur: 3 Datacenter (Surabaya, Jakarta, Yogya) | 10 VM Heterogen")
    print(f"   Skenario Tugas: {scenarios} Cloudlets | {num_runs} Runs per Skenario")
    print("=" * 80 + "\n")
    
    all_runs_data = []
    
    # Header file per-run
    per_run_fieldnames = [
        "Algorithm", "Scenario_Tasks", "Run", "Makespan_s", "AvgResponse_s",
        "Throughput_tps", "AvgUtil_pct", "LBI_Imbalance", "TotalCost_usd", "ExecutionTime_ms"
    ]
    
    for n in scenarios:
        dataset_file = os.path.join(datasets_dir, f"dataset_{n}cloudlet.csv")
        if not os.path.exists(dataset_file):
            dataset_file = os.path.join(output_dir, f"dataset_{n}cloudlet.csv")
        if not os.path.exists(dataset_file):
            print(f"[!] Warning: File dataset_{n}cloudlet.csv tidak ditemukan. Melewati skenario {n}.")
            continue
            
        cloudlets = load_cloudlets_from_csv(dataset_file)
        print(f"\n>>> Memproses Skenario: {n} Cloudlets (Panjang Rata-rata: {sum(c.length_mi for c in cloudlets)/len(cloudlets):.0f} MI)")
        
        for algo in algorithms:
            print(f"    -> Menjalankan Algoritma: {algo.upper():<10} ...", end="", flush=True)
            algo_start = time.time()
            
            for r in range(1, num_runs + 1):
                seed = 42 + r * 17
                t0 = time.perf_counter()
                
                if algo == "Random":
                    sched = schedule_random(cloudlets, vms, seed)
                    res = evaluate_schedule(sched, cloudlets, vms, apply_ljf=False)
                elif algo == "AOA":
                    scheduler = AOAScheduler(cloudlets, vms, pop_size=25, max_iter=40, seed=seed)
                    sched, res = scheduler.optimize()
                elif algo == "ES_LJF":
                    scheduler = ESScheduler(cloudlets, vms, mu=5, ratio=7, mutation_rate=0.10, max_generations=40, seed=seed)
                    sched, res = scheduler.optimize()
                    
                elapsed_ms = (time.perf_counter() - t0) * 1000.0
                
                all_runs_data.append({
                    "Algorithm": algo,
                    "Scenario_Tasks": n,
                    "Run": r,
                    "Makespan_s": round(res.makespan, 2),
                    "AvgResponse_s": round(res.avg_response_time, 2),
                    "Throughput_tps": round(res.throughput, 3),
                    "AvgUtil_pct": round(res.avg_vm_utilization, 2),
                    "LBI_Imbalance": round(res.load_balancing_index, 4),
                    "TotalCost_usd": round(res.total_cost, 2),
                    "ExecutionTime_ms": round(elapsed_ms, 2)
                })
                
            algo_duration = time.time() - algo_start
            print(f" Selesai 10 Run ({algo_duration:.2f}s)")
            
    # Tulis hasil per-run ke CSV
    with open(per_run_csv, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=per_run_fieldnames)
        writer.writeheader()
        writer.writerows(all_runs_data)
        
    print(f"\n[OK] Data per run berhasil disimpan ke: {per_run_csv}")
    
    # Hitung Statistik Ringkasan (Mean & Std Dev)
    summary_data = []
    summary_fieldnames = [
        "Algorithm", "Scenario_Tasks",
        "Makespan_mean", "Makespan_std",
        "AvgResponse_mean", "AvgResponse_std",
        "Throughput_mean", "Throughput_std",
        "AvgUtil_mean", "AvgUtil_std",
        "LBI_mean", "LBI_std",
        "TotalCost_mean", "TotalCost_std"
    ]
    
    for n in scenarios:
        for algo in algorithms:
            runs = [r for r in all_runs_data if r["Scenario_Tasks"] == n and r["Algorithm"] == algo]
            if not runs:
                continue
                
            def calc_mean_std(key: str) -> Tuple[float, float]:
                vals = [r[key] for r in runs]
                mean_val = sum(vals) / len(vals)
                if len(vals) > 1:
                    variance = sum((x - mean_val) ** 2 for x in vals) / (len(vals) - 1)
                    std_val = math.sqrt(variance)
                else:
                    std_val = 0.0
                return round(mean_val, 2), round(std_val, 2)
                
            m_mean, m_std = calc_mean_std("Makespan_s")
            r_mean, r_std = calc_mean_std("AvgResponse_s")
            t_mean, t_std = calc_mean_std("Throughput_tps")
            u_mean, u_std = calc_mean_std("AvgUtil_pct")
            l_mean, l_std = calc_mean_std("LBI_Imbalance")
            c_mean, c_std = calc_mean_std("TotalCost_usd")
            
            summary_data.append({
                "Algorithm": algo,
                "Scenario_Tasks": n,
                "Makespan_mean": m_mean, "Makespan_std": m_std,
                "AvgResponse_mean": r_mean, "AvgResponse_std": r_std,
                "Throughput_mean": t_mean, "Throughput_std": t_std,
                "AvgUtil_mean": u_mean, "AvgUtil_std": u_std,
                "LBI_mean": l_mean, "LBI_std": l_std,
                "TotalCost_mean": c_mean, "TotalCost_std": c_std
            })
            
    # Tulis ringkasan ke CSV
    with open(summary_csv, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=summary_fieldnames)
        writer.writeheader()
        writer.writerows(summary_data)
        
    print(f"[OK] Data ringkasan berhasil disimpan ke: {summary_csv}")
    
    # Cetak Tabel Perbandingan Terminal
    print("\n" + "=" * 95)
    print(f"{'RINGKASAN PERFORMA HASIL UJICOBA KOMPARASI':^95}")
    print("=" * 95)
    print(f"{'Skenario':<10} | {'Algoritma':<10} | {'Makespan (s)':<18} | {'Throughput':<12} | {'Avg Util (%)':<14} | {'LBI (Imbalance)':<16}")
    print("-" * 95)
    
    for row in summary_data:
        m_str = f"{row['Makespan_mean']} ± {row['Makespan_std']}"
        t_str = f"{row['Throughput_mean']:.2f}"
        u_str = f"{row['AvgUtil_mean']}%"
        l_str = f"{row['LBI_mean']} ± {row['LBI_std']}"
        print(f"{row['Scenario_Tasks']:<10} | {row['Algorithm']:<10} | {m_str:<18} | {t_str:<12} | {u_str:<14} | {l_str:<16}")
        
    print("=" * 95 + "\n")


# ==============================================================================
# MAIN ENTRYPOINT
# ==============================================================================

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.abspath(__file__))
    datasets_directory = os.path.join(base_dir, "datasets")
    output_directory = base_dir
    
    print("\n--- Scheduler Real-World Cloud Optimization Started ---")
    run_benchmarks(datasets_directory, output_directory, num_runs=10)
    print("--- Benchmark Selesai Sukses! ---\n")
