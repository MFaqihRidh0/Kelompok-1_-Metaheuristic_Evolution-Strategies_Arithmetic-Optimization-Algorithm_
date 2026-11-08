import org.cloudbus.cloudsim.*;
import org.cloudbus.cloudsim.core.CloudSim;
import org.cloudbus.cloudsim.core.GuestEntity;
import org.cloudbus.cloudsim.core.HostEntity;
import org.cloudbus.cloudsim.provisioners.BwProvisionerSimple;
import org.cloudbus.cloudsim.provisioners.PeProvisionerSimple;
import org.cloudbus.cloudsim.provisioners.RamProvisionerSimple;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.*;

/**
 * ============================================================================
 * PROGRAM SIMULATOR CLOUDSIM: ARITHMETIC OPTIMIZATION ALGORITHM (AOA)
 * vs RANDOM SCHEDULING (BASELINE MINGGU 3)
 * ============================================================================
 * Datacenter: 3 DC Heterogen (Surabaya, Jakarta, Yogyakarta) | 10 VM
 * Dataset: Membaca dataset_100cloudlet.csv s.d dataset_500cloudlet.csv
 * Output: hasil_aoa_sim_per_run.csv dan hasil_aoa_sim_ringkasan.csv
 * ============================================================================
 */
public class AOASchedulingSim {

    static final long SEED = 42;
    static final int[] SCENARIOS = { 100, 200, 300, 400, 500 };
    static final int RUNS = 10;
    static final String[] METRICS = {
            "Makespan", "AvgResponse", "Throughput", "AvgUtil", "LBI", "TotalCost", "Failed"
    };

    static final String[] DC_NAMES = { "DC_Surabaya", "DC_Jakarta", "DC_Yogyakarta" };
    static final int[] VM_TO_DC = { 0, 0, 0, 1, 1, 1, 2, 2, 2, 2 };
    static final int[] VM_TO_HOST = { 0, 0, 0, 1, 1, 1, 2, 2, 2, 2 };

    static class TopologyVmAllocationPolicy extends VmAllocationPolicySimple {
        private final int targetDcIndex;

        public TopologyVmAllocationPolicy(List<? extends HostEntity> list, int targetDcIndex) {
            super(list);
            this.targetDcIndex = targetDcIndex;
        }

        @Override
        public HostEntity findHostForGuest(GuestEntity guest) {
            if (VM_TO_DC[guest.getId()] == targetDcIndex) {
                return getHostList().get(0);
            }
            return null;
        }
    }

    // ============ Datacenter ============
    static Datacenter createDatacenter(String name, int dcIndex, Host host) throws Exception {
        List<Host> hostList = new ArrayList<>();
        hostList.add(host);

        DatacenterCharacteristics characteristics = new DatacenterCharacteristics(
                "x86", "Linux", "Xen", hostList,
                7.0,   // time zone
                0.03,  // cost per second (processing)
                0.05,  // cost per MB memory
                0.001, // cost per MB storage
                0.01   // cost per MB bandwidth
        );

        return new Datacenter(name, characteristics,
                new TopologyVmAllocationPolicy(hostList, dcIndex),
                new LinkedList<Storage>(), 0);
    }

    static Host createHost(int id, double mipsPerCore, int ram, long storage, long bw) {
        List<Pe> peList = new ArrayList<>();
        for (int i = 0; i < 8; i++) {
            peList.add(new Pe(i, new PeProvisionerSimple(mipsPerCore)));
        }
        return new Host(id, new RamProvisionerSimple(ram),
                new BwProvisionerSimple(bw), storage, peList,
                new VmSchedulerTimeShared(peList));
    }

    // ============ VM (10 unit: 2 Large, 3 Medium, 5 Small) ============
    static List<Vm> createVms(int userId) {
        List<Vm> vms = new ArrayList<>();
        long imageSize = 10000;
        for (int i = 0; i < 10; i++) {
            double mips;
            int pes, ram;
            long bw;
            if (i < 2) {        // Large: 3000 x 2 = 6000 MIPS (Surabaya)
                mips = 3000; pes = 2; ram = 8192; bw = 2500;
            } else if (i < 5) { // Medium: 1800 x 2 = 3600 MIPS (Surabaya & Jakarta)
                mips = 1800; pes = 2; ram = 4096; bw = 1000;
            } else {            // Small: 800 x 1 = 800 MIPS (Jakarta & Yogyakarta)
                mips = 800;  pes = 1; ram = 2048; bw = 500;
            }
            vms.add(new Vm(i, userId, mips, pes, ram, bw, imageSize, "Xen",
                    new CloudletSchedulerTimeShared()));
        }
        return vms;
    }

    // ============ Load Dataset Riil dari CSV Minggu 3 ============
    static List<Cloudlet> loadCloudletsFromCsv(int userId, int n) {
        List<Cloudlet> list = new ArrayList<>();
        UtilizationModel full = new UtilizationModelFull();

        String filename = "dataset_" + n + "cloudlet.csv";
        File file = new File(filename);
        if (!file.exists()) {
            file = new File("datasets/" + filename);
        }

        if (file.exists()) {
            try (BufferedReader br = new BufferedReader(new FileReader(file))) {
                String line;
                boolean header = true;
                while ((line = br.readLine()) != null) {
                    if (header) { header = false; continue; }
                    String[] tokens = line.split(",");
                    if (tokens.length >= 4) {
                        int id = Integer.parseInt(tokens[0].trim());
                        long length = (long) Double.parseDouble(tokens[1].trim());
                        long input = (long) Double.parseDouble(tokens[2].trim());
                        long output = (long) Double.parseDouble(tokens[3].trim());
                        int pes = tokens.length > 4 ? Integer.parseInt(tokens[4].trim()) : 1;

                        Cloudlet c = new Cloudlet(id, length, pes, input, output, full, full, full);
                        c.setUserId(userId);
                        list.add(c);
                    }
                }
            } catch (Exception e) {
                System.err.println("[WARN] Gagal membaca CSV " + filename + ", fallback ke sintesis: " + e.getMessage());
            }
        }

        // Fallback jika file CSV tidak ditemukan
        if (list.isEmpty()) {
            Random rnd = new Random(SEED + n);
            for (int i = 0; i < n; i++) {
                long length = 1000 + (long) (rnd.nextDouble() * 49000);
                long input = 50 + rnd.nextInt(251);
                long output = 20 + rnd.nextInt(81);
                Cloudlet c = new Cloudlet(i, length, 1, input, output, full, full, full);
                c.setUserId(userId);
                list.add(c);
            }
        }

        return list;
    }

    // =========================================================================
    // ALGORITMA 1: RANDOM SCHEDULING (BASELINE MINGGU 3)
    // =========================================================================
    static void randomSchedule(DatacenterBroker broker, List<Cloudlet> cloudlets, List<Vm> vms, long seed) {
        Random rnd = new Random(seed);
        for (Cloudlet c : cloudlets) {
            Vm vm = vms.get(rnd.nextInt(vms.size()));
            broker.bindCloudletToVm(c.getCloudletId(), vm.getId());
        }
    }

    // =========================================================================
    // ALGORITMA 2: ARITHMETIC OPTIMIZATION ALGORITHM (AOA) - Abualigah et al. (2021)
    // =========================================================================
    static class AOASolver {
        private final List<Cloudlet> cloudlets;
        private final List<Vm> vms;
        private final int numTasks;
        private final int numVms;
        private final int popSize = 30;
        private final int maxIter = 50;
        private final double alpha = 5.0;
        private final double muRate = 0.499;
        private final Random rnd;

        public AOASolver(List<Cloudlet> cloudlets, List<Vm> vms, long seed) {
            this.cloudlets = cloudlets;
            this.vms = vms;
            this.numTasks = cloudlets.size();
            this.numVms = vms.size();
            this.rnd = new Random(seed);
        }

        // Fungsi Evaluasi Fitness: Estimasi Makespan
        private double evaluateMakespan(int[] schedule) {
            double[] vmBusy = new double[numVms];
            for (int j = 0; j < numTasks; j++) {
                int vmId = schedule[j];
                Vm vm = vms.get(vmId);
                double totalMips = vm.getMips() * vm.getNumberOfPes();
                vmBusy[vmId] += (double) cloudlets.get(j).getCloudletLength() / totalMips;
            }
            double max = 0;
            for (double b : vmBusy) {
                if (b > max) max = b;
            }
            return max;
        }

        public int[] solve() {
            int lb = 0, ub = numVms - 1;

            // 1. Inisialisasi Populasi Agen [popSize x numTasks]
            int[][] population = new int[popSize][numTasks];
            for (int i = 0; i < popSize; i++) {
                for (int j = 0; j < numTasks; j++) {
                    population[i][j] = rnd.nextInt(numVms);
                }
            }

            // Evaluasi awal
            int[] bestSchedule = population[0].clone();
            double bestFitness = evaluateMakespan(bestSchedule);

            for (int i = 1; i < popSize; i++) {
                double f = evaluateMakespan(population[i]);
                if (f < bestFitness) {
                    bestFitness = f;
                    bestSchedule = population[i].clone();
                }
            }

            // 2. Iterasi AOA
            for (int t = 1; t <= maxIter; t++) {
                // Math Optimizer Accelerated (MOA)
                double moa = 0.2 + (double) t * ((0.9 - 0.2) / maxIter);

                // Math Optimizer Probability (MOP)
                double mop = 1.0 - (Math.pow(t, 1.0 / alpha) / Math.pow(maxIter, 1.0 / alpha));

                for (int i = 0; i < popSize; i++) {
                    int[] newInd = population[i].clone();

                    for (int j = 0; j < numTasks; j++) {
                        double r1 = rnd.nextDouble();
                        double r2 = rnd.nextDouble();
                        double r3 = rnd.nextDouble();
                        double perturb = (ub - lb) * muRate * (rnd.nextDouble() - 0.5) * 2.0;

                        double val;
                        if (r1 > moa) {
                            // FASE EKSPLORASI: Pembagian dan Perkalian
                            if (r2 < 0.5) {
                                val = (double) bestSchedule[j] / (mop + 1e-5) * (1.0 + perturb * 0.1);
                            } else {
                                val = (double) bestSchedule[j] * mop * (1.0 + perturb * 0.1);
                            }
                        } else {
                            // FASE EKSPLOITASI: Pengurangan dan Penambahan
                            if (r3 < 0.5) {
                                val = (double) bestSchedule[j] - mop * perturb;
                            } else {
                                val = (double) bestSchedule[j] + mop * perturb;
                            }
                        }

                        // Boundary constraint & diskretisasi ke VM valid
                        int vmIdx = (int) Math.round(val);
                        if (vmIdx < lb) vmIdx = lb;
                        if (vmIdx > ub) vmIdx = ub;
                        newInd[j] = vmIdx;
                    }

                    double newFitness = evaluateMakespan(newInd);
                    if (newFitness < bestFitness) {
                        bestFitness = newFitness;
                        bestSchedule = newInd.clone();
                    }
                    population[i] = newInd;
                }
            }

            return bestSchedule;
        }
    }

    static void aoaSchedule(DatacenterBroker broker, List<Cloudlet> cloudlets, List<Vm> vms, long seed) {
        AOASolver solver = new AOASolver(cloudlets, vms, seed);
        int[] bestSchedule = solver.solve();
        for (int j = 0; j < cloudlets.size(); j++) {
            broker.bindCloudletToVm(cloudlets.get(j).getCloudletId(), bestSchedule[j]);
        }
    }

    // ============ Eksekusi Satu Run Simulasi ============
    static double[] runOnce(int n, int run, String algo, boolean printDetail) throws Exception {
        Log.disable();
        CloudSim.init(1, Calendar.getInstance(), false);

        Host host0 = createHost(0, 3000, 32768, 1000000, 10000);
        Host host1 = createHost(1, 1800, 16384, 1000000, 10000);
        Host host2 = createHost(2, 800,  8192,  1000000, 10000);

        createDatacenter("DC_Surabaya", 0, host0);
        createDatacenter("DC_Jakarta", 1, host1);
        createDatacenter("DC_Yogyakarta", 2, host2);

        DatacenterBroker broker = new DatacenterBroker("Broker_" + algo);
        int userId = broker.getId();

        List<Vm> vms = createVms(userId);
        List<Cloudlet> cloudlets = loadCloudletsFromCsv(userId, n);

        broker.submitGuestList(vms);
        broker.submitCloudletList(cloudlets);

        if (algo.equalsIgnoreCase("AOA")) {
            aoaSchedule(broker, cloudlets, vms, run);
        } else {
            randomSchedule(broker, cloudlets, vms, run);
        }

        CloudSim.startSimulation();
        CloudSim.stopSimulation();

        List<Cloudlet> done = broker.getCloudletReceivedList();
        return analyze(n, run, algo, done, vms, printDetail);
    }

    // ============ Analisis Metrik ============
    static double[] analyze(int n, int run, String algo, List<Cloudlet> done, List<Vm> vms, boolean printDetail) {
        double minStart = Double.MAX_VALUE, maxFinish = 0, sumResp = 0, cost = 0;
        int success = 0;
        double[] busy = new double[vms.size()];
        int[] count = new int[vms.size()];
        long[] totalMi = new long[vms.size()];

        for (Cloudlet c : done) {
            if (c.getStatus() == Cloudlet.CloudletStatus.SUCCESS) {
                success++;
                minStart = Math.min(minStart, c.getExecStartTime());
                maxFinish = Math.max(maxFinish, c.getFinishTime());
                sumResp += c.getFinishTime() - c.getSubmissionTime();
                cost += c.getProcessingCost();
                Vm vm = vms.get(c.getVmId());
                busy[c.getVmId()] += (double) c.getCloudletLength() / (vm.getMips() * vm.getNumberOfPes());
                count[c.getVmId()]++;
                totalMi[c.getVmId()] += c.getCloudletLength();
            }
        }

        double makespan = maxFinish - minStart;
        double avgResp = success > 0 ? sumResp / success : 0;
        double throughput = makespan > 0 ? success / makespan : 0;
        int failed = n - success;

        double[] util = new double[vms.size()];
        double meanU = 0;
        for (int i = 0; i < util.length; i++) {
            util[i] = makespan > 0 ? Math.min(1.0, busy[i] / makespan) : 0;
            meanU += util[i];
        }
        meanU /= util.length;

        double var = 0;
        for (double u : util) var += (u - meanU) * (u - meanU);
        double lbi = Math.sqrt(var / util.length);

        if (printDetail) {
            System.out.println(String.format("   [%s] %d Cloudlet (Run %d) -> Makespan: %.2fs | Throughput: %.2f t/s | Util: %.1f%% | LBI: %.4f",
                    algo, n, run, makespan, throughput, meanU * 100, lbi));
        }

        return new double[] { makespan, avgResp, throughput, meanU * 100, lbi, cost, failed };
    }

    static double mean(double[] x) {
        double s = 0;
        for (double v : x) s += v;
        return s / x.length;
    }

    static double stdSample(double[] x) {
        if (x.length < 2) return 0;
        double m = mean(x), s = 0;
        for (double v : x) s += (v - m) * (v - m);
        return Math.sqrt(s / (x.length - 1));
    }

    public static void main(String[] args) throws Exception {
        System.out.println("================================================================================");
        System.out.println("   SIMULASI CLOUDSIM: AOA vs RANDOM SCHEDULING (DATASET MINGGU 3)");
        System.out.println("================================================================================");

        List<String> perRunCsv = new ArrayList<>();
        perRunCsv.add("Algorithm,Cloudlets,Run," + String.join(",", METRICS));

        List<String> summaryCsv = new ArrayList<>();
        summaryCsv.add("Algorithm,Cloudlets,Makespan_mean,Makespan_std,Throughput_mean,Throughput_std,AvgUtil_mean,AvgUtil_std,LBI_mean,LBI_std");

        for (String algo : new String[] { "Random", "AOA" }) {
            System.out.println("\n>>> MENJALANKAN SIMULASI ALGORITMA: " + algo);
            for (int n : SCENARIOS) {
                double[][] results = new double[RUNS][];
                for (int run = 1; run <= RUNS; run++) {
                    results[run - 1] = runOnce(n, run, algo, run == 1);
                    StringBuilder row = new StringBuilder();
                    row.append(algo).append(",").append(n).append(",").append(run);
                    for (int k = 0; k < METRICS.length; k++) {
                        row.append(",").append(String.format(Locale.US, "%.2f", results[run - 1][k]));
                    }
                    perRunCsv.add(row.toString());
                }

                double[] makespans = new double[RUNS];
                double[] throughputs = new double[RUNS];
                double[] utils = new double[RUNS];
                double[] lbis = new double[RUNS];
                for (int r = 0; r < RUNS; r++) {
                    makespans[r] = results[r][0];
                    throughputs[r] = results[r][2];
                    utils[r] = results[r][3];
                    lbis[r] = results[r][4];
                }

                summaryCsv.add(String.format(Locale.US, "%s,%d,%.2f,%.2f,%.2f,%.2f,%.2f,%.2f,%.4f,%.4f",
                        algo, n, mean(makespans), stdSample(makespans),
                        mean(throughputs), stdSample(throughputs),
                        mean(utils), stdSample(utils),
                        mean(lbis), stdSample(lbis)));
            }
        }

        Files.write(Paths.get("hasil_aoa_sim_per_run.csv"), perRunCsv, StandardCharsets.UTF_8);
        Files.write(Paths.get("hasil_aoa_sim_ringkasan.csv"), summaryCsv, StandardCharsets.UTF_8);

        System.out.println("\n[SUKSES] Seluruh simulasi CloudSim selesai dieksekusi!");
        System.out.println("Hasil tersimpan di: hasil_aoa_sim_per_run.csv & hasil_aoa_sim_ringkasan.csv");
    }
}

