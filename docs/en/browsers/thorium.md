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

## 3. Example flags (`~/.config/thorium-flags.conf`)

Some RPM builds ignore standard paths; flags are often embedded in a **`.desktop`** file or generated from a small config. Below is a **starting point** to validate on your exact browser build and driver.

```bash
# --- Graphics (ANGLE / Wayland) ---
--ozone-platform-hint=auto
--ozone-platform=wayland
--use-gl=angle
--use-angle=gl
--ignore-gpu-blocklist
# Caution: may reduce stability; remove and compare if you see glitches
--disable-gpu-driver-bug-workarounds

# --- Video (VA-API, no AV1 in hardware) ---
--enable-features=VaapiVideoDecoder,VaapiVideoDecodeLinuxGL
--disable-features=UseChromeOSDirectVideoDecoder,Av1VideoDecoder

# --- Performance ---
--enable-zero-copy
--enable-gpu-rasterization
--num-raster-threads=4
--force-gpu-mem-available-mb=4096

# --- HDR (experimental; validate with content and display) ---
--force-color-profile=hdr10
--enable-hdr
```

**AV1:** Disabling `Av1VideoDecoder` matches Zen’s intent (`media.av1.enabled = false`): the GTX 1660 SUPER has **no** AV1 hardware decode; VP9 is the practical choice.

**Flag names:** If the browser rejects a flag, check `thorium --help` / `chromium --help` for your build—the canonical raster flag is `--num-raster-threads`.

---

## 4. Launcher and verification

Create or edit a `.desktop` so **all** arguments actually reach the process (some packages ignore an external conf).

After launch, verify:

* `chrome://gpu` — acceleration status, GL/ANGLE errors.
* `chrome://media-internals` — which decoder is used during playback.
* Long sessions on maps — regressions after flag changes.

---

## 5. Summary

* Thorium makes sense as a **Blink/ANGLE** tool on the **same machine** as Zen, with the same **AV1 limitation** and focus on **Wayland + VA-API**.
* Good tuning is **iterative**: start from section 3, then peel off contentious flags when something breaks.
* A natural next step for the repo is a checked-in flag list under `configs/` plus an install helper—once your driver + Thorium combo is stable.
