// =============================================================================
// ZEN BROWSER CONFIG v21 (XEON WAYLAND PERFECTED - ANNOTATED)
// =============================================================================
// SYSTEM: Xeon E5-2696 v3 (36 Threads) | 64GB RAM | GTX 1660 SUPER
// GRAPHICS: NVIDIA Wayland Safe Mode + VP9 HW Video + 165Hz
// =============================================================================

//[SECTION 1: GRAPHICS (NVIDIA WAYLAND SAFE-MODE & WEBRENDER)]
// -----------------------------------------------------------------------------

// Force WebRender (Rust) for all UI and page content.
user_pref("gfx.webrender.all", true);
user_pref("gfx.webrender.enabled", true);

// Ignore Mozilla blocklists that disable acceleration on NVIDIA Linux drivers.
user_pref("layers.acceleration.force-enabled", true);

// Force WebGL so heavy 3D work runs on the GTX 1660S instead of the CPU.
user_pref("webgl.force-enabled", true);

// Isolate GPU work in a separate process (driver crash should not kill the whole browser).
user_pref("layers.gpu-process.enabled", true);
user_pref("layers.gpu-process.force-enabled", true);

// Enable driver-bug workarounds for the proprietary NVIDIA stack.
user_pref("gfx.work-around-driver-bugs", true);

// Never fall back to WARP (CPU software rendering) on GPU errors; stay on the GPU path.
user_pref("gfx.webrender.use-warp", false);

// Give WebRender up to 16 threads for geometry (cap avoids saturating the CPU bus).
user_pref("gfx.webrender.worker-thread-count", 16);


//[SECTION 2: DISPLAY (165Hz & KWIN COMPOSITING FIX)]
// -----------------------------------------------------------------------------

// 0 = no 60 FPS cap; sync to the monitor refresh (165 Hz).
user_pref("layout.frame_rate", 0);

// Native Wayland vsync to reduce tearing.
user_pref("widget.wayland.vsync.enabled", true);

// 0 partial rects avoids NVIDIA/Wayland scroll artifacts (“flickering squares”).
user_pref("gfx.webrender.max-partial-present-rects", 0);

// Precache shaders to reduce first-paint jank.
user_pref("gfx.webrender.precache-shaders", true);

// Persist compiled shaders so revisits skip recompilation.
user_pref("gfx.webrender.program-binary-disk", true);

//[CRASH GUARD]: Do not delegate window compositing to KDE (KWin).
// Mitigates “Wayland protocol error 7: dmabufs failed” with NVIDIA drivers.
user_pref("gfx.webrender.compositor", false);
user_pref("gfx.webrender.compositor.force-enabled", false);


//[SECTION 3: COLOR & FONTS (HDR 10-BIT)]
// -----------------------------------------------------------------------------

// -1 = let Wayland own UI scaling (DPI); avoids blur on HiDPI panels.
user_pref("layout.css.devPixelsPerPx", "-1");

// Strong subpixel AA in WebRender; keep font AA on.
user_pref("gfx.webrender.quality.force-subpixel-aa-where-possible", true);
user_pref("gfx.text.disable-aa", false);

// Skia for all 2D content.
user_pref("gfx.content.azure.backends", "skia");

// Full color management, ICC v4, native sRGB.
user_pref("gfx.color_management.mode", 1);
user_pref("gfx.color_management.enablev4", true);
user_pref("gfx.color_management.native_srgb", true);

// 10-bit surfaces when the display supports them (less gradient banding).
user_pref("gfx.webrender.10bit-format", true);


//[SECTION 4: CANVAS & 2D (PERFORMANCE)]
// -----------------------------------------------------------------------------

// GPU-accelerated HTML5 Canvas (maps, games, charts).
user_pref("gfx.canvas.accelerated", true);

// Large Canvas texture pool in VRAM.
user_pref("gfx.canvas.accelerated.cache-items", 65536);
user_pref("gfx.canvas.accelerated.cache-size", 4096);

// Retain display lists for fast scroll repaints.
user_pref("layout.display-list.retain", true);
user_pref("layout.display-list.retain.chrome", true);
user_pref("layers.tiles.max-pool-size", 64);

// WebGL off the main thread to avoid UI stalls on heavy sites.
user_pref("webgl.out-of-process", true);


//[SECTION 5: VIDEO (VP9 HW ACCELERATION FIX)]
// -----------------------------------------------------------------------------

// VA-API path so Linux can feed NVDEC on NVIDIA.
user_pref("media.ffmpeg.vaapi.enabled", true);

// Do not force codecs; let the stack negotiate what NVDEC can decode.
user_pref("media.hardware-video-decoding.force-enabled", false);

// 0 = safe copyback to RAM; avoids proprietary-driver segfaults on zero-copy paths.
user_pref("media.ffmpeg.vaapi.force-surface-zero-copy", 0);

// Prefer system FFmpeg with HW decode; disable internal ffvpx soft decode.
user_pref("media.ffvpx.enabled", false);
user_pref("media.prefer-non-ffvpx", true);
user_pref("media.rdd-ffmpeg.enabled", true);

// Relax RDD sandbox so the NVIDIA driver can reach devices like /dev/dri/renderD128.
user_pref("security.sandbox.rdd.level", 0);
user_pref("media.rdd-vpx.enabled", false);

//[MAIN GTX 1660 SUPER NOTE]: No AV1 HW decode — disable AV1 so YouTube serves VP9 (full HW path).
user_pref("media.av1.enabled", false);


//[SECTION 6: XEON 36-THREADS (IPC & GC BALANCE)]
// -----------------------------------------------------------------------------

// Cap at 16 content processes to reduce L3/cache thrash on Xeon.
user_pref("dom.ipc.processCount", 16);
user_pref("dom.ipc.processCount.webIsolated", 16);

// Parallel JS/WASM parsing.
user_pref("javascript.options.parallel_parsing", true);
user_pref("javascript.options.wasm", true);

// Worker caps aligned with 36 threads total.
user_pref("dom.workers.max_per_domain", 36);
user_pref("dom.worker.limit", 36);

// Image decode parallelism multiplier 1 (avoids context-switch storms).
user_pref("image.parallel.decode.limit.multiplier", 1);

// Prioritize the active tab.
user_pref("dom.ipc.scheduler.useActiveTabPriority", true);

// Use Linux QoS: background tabs can drop to eco mode.
user_pref("dom.ipc.processPriorityManager.enabled", true);
user_pref("dom.ipc.processPriorityManager.backgroundUsesEcoQoS", true);

//[JS GC]: ~1 GB high water; sub-GB allocation threshold before major GC pressure.
user_pref("javascript.options.mem.high_water_mark", 1024);
user_pref("javascript.options.mem.gc_allocation_threshold_mb", 100);

// 10 ms incremental GC slices — smooth on a 165 Hz display.
user_pref("javascript.options.mem.gc_incremental_slice_ms", 10);


// [SECTION 7: 64GB RAM (RAMDISK MODE & BFCache)]
// -----------------------------------------------------------------------------

// No disk cache; keep hot data in RAM.
user_pref("browser.cache.disk.enable", false);
user_pref("browser.cache.memory.enable", true);

// 16 GB browser memory cache (Firefox integer cap).
user_pref("browser.cache.memory.capacity", 16777216);

// -1 = allow arbitrarily large memory cache entries (e.g. full media blobs).
user_pref("browser.cache.memory.max_entry_size", -1);

// ~8 GB for decoded images (smooth up/down scroll).
user_pref("image.mem.max_decoded_image_kb", 8388608);

// BFCache: keep many recent pages in RAM for instant Back.
user_pref("browser.sessionhistory.max_total_viewers", 50);

// With 64 GB RAM, do not aggressively unload background tabs.
user_pref("browser.tabs.unloadOnLowMemory", false);

// Do not panic-unload tabs until free RAM drops below ~1 GB (Linux).
user_pref("browser.low_commit_space_threshold_mb", 1024);


//[SECTION 7.1: MEDIA CACHE (YOUTUBE / TWITCH IN RAM)]
// -----------------------------------------------------------------------------

// ~4 GB for streaming buffer (disk cache is off).
user_pref("media.memory_cache_max_size", 4194304);

// Combined media buffer budget ~8 GB.
user_pref("media.memory_caches_combined_limit_kb", 8388608);

// Allow up to ~20% of system RAM for media caches (~12 GB on 64 GB).
user_pref("media.memory_caches_combined_limit_pc_sysmem", 20);

// Aggressive readahead when bandwidth allows.
user_pref("media.cache_readahead_limit", 99999);
user_pref("media.cache_resume_threshold", 99999);


//[SECTION 8: NETWORK, LATENCY & PARALLELISM]
// -----------------------------------------------------------------------------
user_pref("network.http.http3.enable", true);
user_pref("network.predictor.enabled", true);
user_pref("network.predictor.enable-prefetch", true);

// [FIX]: Disable HTTP tailing (serializes loads; hurts parallel asset fetch).
user_pref("network.http.tailing.enabled", false);

// [FIX]: Disable request pacing (caps req/s; we want full throughput).
user_pref("network.http.pacing.requests.enabled", false);

// [PARALLEL DNS]: Up to 36 parallel lookups (match thread count).
user_pref("network.dns.parallelLookupCount", 36);

// More persistent connections per host (e.g. Google assets on same IPs).
user_pref("network.http.max-persistent-connections-per-server", 20);
user_pref("network.http.max-connections", 1500);

// HTTP/2 and HTTP/3 priority updates.
user_pref("network.http.http2.priority_updates", true);
user_pref("network.http.http3.priority_updates", true);

// TLS False Start for lower handshake latency.
user_pref("security.ssl.enable_false_start", true);

// Aggressive DNS/TCP prefetch and larger DNS cache.
user_pref("network.dns.disablePrefetch", false);
user_pref("network.prefetch-next", true);
user_pref("network.http.speculative-parallel-limit", 24);
user_pref("network.dnsCacheEntries", 20000);
user_pref("network.dnsCacheExpiration", 3600);

// First paint without artificial delay.
user_pref("nglayout.initialpaint.delay", 0);
user_pref("content.notify.interval", 0);
user_pref("content.notify.ontimer", true);


//[SECTION 9: HYGIENE (TELEMETRY OFF)]
// -----------------------------------------------------------------------------

// No Mozilla telemetry, crash reports, or health uploads.
user_pref("datareporting.policy.dataSubmissionEnabled", false);
user_pref("datareporting.healthreport.uploadEnabled", false);
user_pref("toolkit.telemetry.unified", false);
user_pref("toolkit.telemetry.enabled", false);

// Global Privacy Control — signal do-not-sell to sites.
user_pref("privacy.globalprivacycontrol.was_ever_enabled", true);

// No Shield studies or Normandy remote experiments.
user_pref("app.shield.optoutstudies.enabled", false);
user_pref("app.normandy.enabled", false);

//[CRITICAL ON LINUX]: accessibility.force_disabled = 1 avoids a11y stack freezes when
// external screen readers probe the UI.
user_pref("accessibility.force_disabled", 1);

//[SECTION 10: AUDIO (PIPEWIRE / PULSE FIX)]
// -----------------------------------------------------------------------------

// Decode audio in a utility process for isolation from tabs.
user_pref("media.utility-process.enabled", true);
user_pref("media.utility-process.audio-decoding.enabled", true);

// Faster Cubeb init on PipeWire (CachyOS/Fedora).
user_pref("media.cubeb.sandbox", false);

// Force stereo; avoids “0 channels” confusion in some setups.
user_pref("media.audio-max-channels", 2);

// Disable browser-side audio processing (echo/noise); PipeWire/KDE handle it.
user_pref("media.audioproc.enabled", false);
