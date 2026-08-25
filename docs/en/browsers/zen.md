# 🔴 Zen Browser: v21.1 configuration (XEON WAYLAND PERFECTED)

> Zen (Firefox fork) is the **primary browser**. The profile is tuned for Wayland, proprietary NVIDIA, 165 Hz, 64 GB RAM, and a high–thread-count Xeon: WebRender, color, networking, and cache are aligned.

**📂 [Configuration files →](../../../configs/zen-browser/)** | **📖 [Documentation index →](../README.md)** | **🇷🇺 [Русская версия →](../../ru/browsers/zen.md)**

---

## 1. Why a dedicated profile, and what changed in v21.1

Older notes suggested **disabling the GPU process** to work around driver issues. In **v21** the balance is different: the **GPU process stays on**, **driver workarounds** are enabled (`gfx.work-around-driver-bugs`), and **delegating compositing to KWin** is disabled (`gfx.webrender.compositor`) to reduce the chance of `Wayland protocol error 7: dmabufs failed` on NVIDIA. WARP remains off — CPU software rendering is not the target.

**v21.1 (Aug 2026) — NVIDIA hardware video decode actually engages.** Firefox blocklists VA-API on NVIDIA even when `libva` works; two `user.js` lines were flipped so `about:support` now reports `HWDEC` for H.264/VP8/VP9/HEVC:

* `media.hardware-video-decoding.force-enabled` → **`true`** (bypasses the NVIDIA VA-API blocklist; the old `false` line in `user.js` kept overriding `about:config` edits on every start).
* `media.rdd-vpx.enabled` → **`true`** (keeps VP8/VP9 in the RDD process, which is the path the VA-API decoder uses; `false` forced software decode into the page process).
* **Session env** (`~/.config/environment.d/99-zen-nvidia.conf`) now exports `LIBVA_DRIVER_NAME=nvidia` and `NVD_BACKEND=direct` so launcher-menu starts also get NVDEC — not just terminal launches that passed them by hand.

Verification: `about:support → codecSupportInfo` shows `HWDEC` for H264/VP9/VP8/HEVC, and `nvidia-smi pmon` shows the `dec` column filling during playback.

High-level blocks:

* **Graphics:** WebRender, forced acceleration, WebGL on the GPU, up to 16 WebRender geometry threads.
* **Display:** sync to 165 Hz, Wayland vsync, partial present disabled (fewer scroll artifacts on NVIDIA).
* **Video:** VA-API toward NVDEC, no aggressive codec forcing; **AV1 disabled** (`media.av1.enabled`) so YouTube serves **VP9** (GTX 1660 SUPER has no AV1 hardware decode). For stability on the proprietary stack, a safe frame copy path is used; RDD sandbox is relaxed where the driver needs device access.
* **Memory and network:** RAM cache, media buffer limits, HTTP/3, tailing/pacing disabled where parallel fetch matters.

Zen may still feel different from Chromium on heavy Canvas/WebGL sites (different engines), but v21 is a coherent workstation profile, not a pile of unrelated toggles.

---

## 2. `user.js` files

Configs in the repo (copy into the profile directory: `about:support` → **Folder**):

* **[user.js](../../../configs/zen-browser/user.js)** — English comments  
* **[user.ru.js](../../../configs/zen-browser/user.ru.js)** — Russian comments  

Both set the **same** `user_pref` keys and values; only comment language differs. Prefer the files in the repo over pasted snippets here.

---

## 3. Browser roles

| Task | Recommendation |
|------|----------------|
| Daily browsing, privacy, HDR/color, single Firefox-flavored profile | **Zen** |
| Heavy maps/WebGL (e.g. Yandex Maps), sites where Blink feels smoother | **Thorium** (see [thorium.md](thorium.md)) |

With this config, Zen gives predictable graphics and video on your stack; keeping a Chromium-class browser for engine-heavy pages is reasonable.
