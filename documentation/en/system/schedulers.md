# 🧠 Sched-ext: CPU Scheduler Selection for 36 Threads

> Documentation of experience using various eBPF schedulers (`sched_ext`) on CachyOS kernel. Goal: find balance between responsiveness (latency) and throughput on NUMA architecture.

**📖 [Documentation Index →](../README.md)** | **🛠️ [System Core Setup →](core-setup.md)** | **🇷🇺 [Русская версия →](../ru/system/schedulers.md)**

---

## Testing Timeline

### 1. SCX_LAVD (Latency-criticality Aware Virtual Deadline)

*   Status: ❌ **CRASH**
*   Symptoms: Kernel panic / NULL pointer dereference.
*   Cause: In "Autopilot" mode, LAVD overloaded **Core 0**, trying to handle all interrupts through it. System choked.
*   Verdict: Not suitable for current 18-core Xeon configuration without fine manual mask tuning.

---

### 2. SCX_RUSTY

*   Status: ⚠️ **CONDITIONALLY SUITABLE**
*   Pros: Excellent multitasking, uses all cores.
*   Cons: When launching heavy applications (browser with 30+ processes), mouse cursor starts "lagging". Rusty is oriented towards server workloads (throughput), not desktop smoothness.

---

### 3. SCX_RUSTLAND

*   Status: ✅ **CHOICE FOR SMOOTHNESS**
*   Pros: Absolute priority for interactive tasks (KWin, Xwayland, Browser). Mouse cursor never lags, even at 100% CPU load.
*   Cons: Slightly lower speed in synthetic benchmarks.
*   Incident: There was suspicion of system freeze during video playback, but likely cause was NVIDIA driver conflict, not scheduler.

---

### 4. SCX_BPFLAND

*   Status: ⭐ **CURRENT FAVORITE**
*   Description: Simple and reliable vtime scheduler.
*   Result: "Very pleased". Subjectively provides the most stable system operation without extremes.

---

## Recommendation

For daily desktop work, use **scx_bpfland** or **scx_rustland**. If every FPS in rendering matters (Blender) — switch to **scx_rusty**.

---

## Management Commands

Enable scheduler:

```bash
sudo systemctl enable --now scx-bpfland
```

Check status:

```bash
systemctl status scx-bpfland --no-pager
```

List all schedulers:

```bash
systemctl status scx-* --no-pager
```
