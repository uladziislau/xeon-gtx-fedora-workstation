# 🛠 System Core: Xeon E5-2696 v3 & Kernel Optimization

> This section covers the "foundation" of the system: Linux kernel, boot parameters, and power management.

**📖 [Documentation Index →](../README.md)** | **🧠 [CPU Schedulers →](schedulers.md)** | **🇷🇺 [Русская версия →](../ru/system/core-setup.md)**

---

## 1. Boot Parameters (GRUB)

File: `/etc/default/grub`  
Parameter: `GRUB_CMDLINE_LINUX`

Configuration optimized for Haswell-EP (Xeon v3) architecture and large RAM (64GB).

```
GRUB_CMDLINE_LINUX="... nvidia-drm.modeset=1 clear_cpuid=514 zswap.max_pool_percent=100 transparent_hugepage=always"
```

### Parameter Details:

*   **`clear_cpuid=514`**: Critical hack for Haswell. Disables specific branch prediction limitations, significantly improving system responsiveness in browsers.
*   **`zswap.max_pool_percent=100`**: With 64GB RAM, we allow ZSWAP to use all available space as compressed buffer. This completely eliminates delays related to physical disk (SSD) access.
*   **`transparent_hugepage=always`**: Accelerates memory operations by using large pages (2MB instead of 4KB). Essential for systems with 32GB+ RAM.
*   **`mitigations=off`** (Optional): If security is secondary to speed, disabling Spectre/Meltdown patches gives Haswell a second wind (+10-15% speed).

---

## 2. Power Management & Cooling

On Xeon v3, it's crucial to maintain balance between frequency and VRM (power delivery circuits on motherboard) heating.

### Power Profiles:

*   Uses `power-profiles-daemon` (standard for KDE 6).
*   **WARNING**: Package `tuned-ppd` was removed as it conflicted with native daemon and broke KDE slider.
*   Recommended mode: **Performance**.

### Power Limits (intel-undervolt):

To prevent overheating on Chinese motherboards (Huananzhi X99-QD4), limits are set:
*   **Short Duration (PL2)**: 165W
*   **Long Duration (PL1)**: 145W

This allows CPU to jump to 3.8 GHz but prevents it from "frying" VRM to critical temperatures.

### Thermal Mode (C-States):

*   Experiment was conducted with `intel_idle.max_cstate=1` parameter.
*   **Result**: Idle temperature jumped to 60°C.
*   **Solution**: **PARAMETER REMOVED**. With C-states enabled (default), temperature dropped to ideal 34-37°C without losing responsiveness.

---

## 3. Applying Changes

After editing `/etc/default/grub`:

```bash
sudo grub2-mkconfig -o /boot/grub2/grub.cfg
```

Verify boot parameters:

```bash
cat /proc/cmdline
```
