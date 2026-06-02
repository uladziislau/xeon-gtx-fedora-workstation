# 🔵 Thorium Browser: role, stack, and tuning for this machine

> Thorium is the **secondary browser** (Chromium/Blink) for workloads where Zen’s Gecko stack is less pleasant: heavy WebGL/Canvas (e.g. maps), some web apps, and cases where ANGLE + Blink produce smoother behavior.

**📖 [Documentation index →](../README.md)** | **🇷🇺 [Русская версия →](../../ru/browsers/thorium.md)** | **Zen (primary) → [zen.md](zen.md)**

---

## 1. Why Thorium on this hardware

**Hardware:** Xeon E5-2696 v3 (Haswell, AVX2), 64 GB RAM, GTX 1660 SUPER, Wayland (KDE).

* **AVX2:** Thorium builds are often compiled with aggressive x86 tuning; on Haswell that actually uses the ISA you have. The win is not always dramatic for light browsing, but heavy JS and decode can differ from a generic Chromium build.
* **Blink + ANGLE:** Unlike Gecko, Chrome’s stack can route through **ANGLE** (`--use-gl=angle`), which in practice often yields **smooth** scroll and zoom on maps/WebGL with proprietary NVIDIA on Linux.
* **VA-API patches:** Thorium sometimes carries patches that ease hardware video on Linux; with NVIDIA this is still something you **verify** locally (driver version, `nvidia-smi`, `chrome://gpu`).

Thorium is not a “replacement” for Zen on privacy/Firefox ecosystem grounds—it is an **engineering companion** on a different engine.

---

## 2. How to think about Chromium tuning vs Zen

| Aspect | Zen (Firefox) | Thorium (Chromium) |
|--------|----------------|---------------------|
| Config | `user.js` / `about:config` | Command-line flags, sometimes policies |
| Video | prefs: VA-API, RDD, AV1 off | `--enable-features` / `--disable-features`, different codec pipeline |
| Graphics | WebRender prefs | GPU process, ANGLE/Vulkan via flags |
| Risks | KWin/dmabuf, WARP | Different bugs: “driver workarounds” flags can fight each other |

A **working Zen v21 profile** (see [zen.md](zen.md)) and a **Thorium flag set** should be **aligned in goals** but not copied line-for-line—they are different programs.

Shared goals on your system:

1. **Wayland:** `--ozone-platform=wayland` (with a consistent `hint`) so you do not silently land on XWayland.
2. **No AV1 hardware on GTX 1660 SUPER:** like Zen, avoid demanding AV1 decode in hardware—prefer **VP9** (or H.264) to reduce soft-decode or instability.
3. **GPU:** `--ignore-gpu-blocklist` is a conscious risk trade; **`--disable-gpu-driver-bug-workarounds`** may speed things up or **hurt** stability—treat it as a **test switch**, not a permanent law.
4. **Zero-copy:** `--enable-zero-copy` on NVIDIA + Wayland can sometimes cause glitches or crashes; if video or overlays misbehave, **try turning it off first** when debugging.

---

## 3. Why chrome://flags stays on Default

**chrome://flags** lists **experiments** baked into that build. Settings from [`flags.conf`](../../../configs/thorium-browser/flags.conf) are injected via the **command line** (`.desktop`); they **do not** show up here as Enabled—that is expected. See the real argv string under **`chrome://gpu` → Command Line** or **`chrome://version`**.

**Hardware, in Chromium terms:**

- **GTX 1660 SUPER (6 GB VRAM, no AV1 decode):** the repo config already enables VA-API, disables AV1, GPU raster, and a VRAM budget hint (`--force-gpu-mem-available-mb`); add an extension like enhanced-h264ify if sites still push AV1.
- **Xeon E5-2696 v3:** raster throughput is scaled with `--num-raster-threads`; JS/network parallelism is handled internally. There is no “Xeon” or “AVX2” toggle in the UI.
- **64 GB RAM, 4×16 GB DDR4-2133 (quad channel):** the browser **does not** see DIMM topology—there is no quad-channel flag. What helps is a **larger cache** (`--disk-cache-size`, optional tmpfs path; see commented block in `flags.conf`).

> [!WARNING]
> **Danger of manual experiments in `chrome://flags`:**
> Enabling certain options via the `chrome://flags` GUI (which are saved in the profile's `Local State` file) can severely degrade performance.
> 
> * **`enable-gpu-service-logging`** — **never enable this**. It forces logging of every single GPU command to stderr. In heavy WebGL apps like Yandex/Google Maps where thousands of GPU calls happen per second, this floods system logs and introduces massive rendering stutter and UI lag.
> * **`gpu-rasterization-msaa-sample-count`** — do not set this to `16`. This forces the GPU to rasterize 2D tiles with 16x MSAA, which at 1440p 165Hz on a GTX 1660 SUPER completely exhausts memory bandwidth, causing heavy scrolling lag.
> * **`skia-graphite`** — the experimental Skia Graphite engine is unstable on Linux + NVIDIA OpenGL (ANGLE) backend, leading to stutters and crashes.
> 
> **Recommendation:** For maximum smoothness, open `chrome://flags`, click **"Reset all"** in the top right, and restart Thorium. All optimized settings from `flags.conf` will continue to apply via CLI flags.

Touch **chrome://flags** only for experiments **not** covered by the CLI, and change **one at a time** so you can bisect regressions.

---

## 4. Repository flag lists and installation

Canonical lists (one line = one argv token; lines starting with `#` are **not** passed through):

* **[flags.conf](../../../configs/thorium-browser/flags.conf)** — English comments; consumed by [`scripts/optimize.sh`](../../../scripts/optimize.sh).
* **[flags.ru.conf](../../../configs/thorium-browser/flags.ru.conf)** — same active flags, Russian comments for reading.

The default **active** block includes Wayland, ANGLE (GL), VA-API with **`VaapiIgnoreDriverChecks`**, **ParallelDownloading**, AV1 disabled, **partial raster disabled** (`--disable-partial-raster`, aligned with Zen’s scroll fix), safe video frames (`--disable-gpu-memory-buffer-video-frames`), GPU raster, **12** raster threads, **16** renderer processes, **6 GB-class** VRAM hint, and **tmpfs-backed** disk/media caches (16 GB / 8 GB) under `/tmp/thorium-cache`. More aggressive options (`--disable-gpu-driver-bug-workarounds`, `--enable-zero-copy`, background throttling off, HDR) stay **commented out**—uncomment after you validate on your driver.

**Install:** `sudo ./scripts/optimize.sh` writes `~/.config/thorium/thorium-flags.conf` and removes stale user `.desktop` overrides that duplicated flags. The `/usr/bin/thorium-browser` wrapper loads the conf file on every launch — keep `Exec=` in `.desktop` as plain `/usr/bin/thorium-browser %U`.

**AV1:** Disabling `Av1VideoDecoder` matches Zen’s intent (`media.av1.enabled = false`): the GTX 1660 SUPER has **no** AV1 hardware decode; VP9 is the practical choice.

If a flag is rejected, check `thorium --help` for your build—the raster flag is `--num-raster-threads`.

📖 **[configs/README.md — Thorium section](../../../configs/README.md)**

---

## 5. Launcher and verification

Create or edit a `.desktop` so **all** arguments actually reach the process (some packages ignore an external conf).

After launch, verify:

* `chrome://gpu` — acceleration status, GL/ANGLE errors.
* `chrome://media-internals` — which decoder is used during playback.
* Long sessions on maps — regressions after flag changes.

---

## 6. Summary

* Thorium makes sense as a **Blink/ANGLE** tool on the **same machine** as Zen, with the same **AV1 limitation** and focus on **Wayland + VA-API**.
* Good tuning is **iterative**: edit [`configs/thorium-browser/flags.conf`](../../../configs/thorium-browser/flags.conf), then re-run `optimize.sh` or adjust the launcher by hand.
* `./scripts/check.sh` reports whether Thorium flag files and a user `.desktop` are present.
