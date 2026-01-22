// ZEN BROWSER CONFIG v9 (WORKSTATION UNLIMITED, MASTER EDITION) - ENGLISH
// =============================================================================
// Hardware: CPU Xeon E5-2696 v3 (18 cores / 36 threads)
//           RAM 62.7 GB
//           GPU NVIDIA GeForce GTX 1660 Super
// Display:  2K (2560x1440) @ 165 Hz
// OS:       Fedora 43 KDE (Wayland), NVIDIA driver 580.xx
// Profile:  Heavy SPA, WebGPU, Google AI Studio, DevTools, multi-threading without resource limits.
// Goal:     Maximum performance and smoothness. Priority is speed and responsiveness,
//           not resource saving or universal compatibility.
// =============================================================================
//
// IMPORTANT:
// - This configuration is designed for a powerful workstation with large CPU/GPU/RAM reserves.
// - Many settings are aggressive and not suitable for weak machines.
// - There are no debug flags that break the UI (e.g., devtools.chrome.enabled).
// - All parameters are coordinated to avoid hidden conflicts.
// =============================================================================



// [SECTION 1: GLOBAL SYNC AND FPS (165 HZ ON WAYLAND + NVIDIA)]
// -----------------------------------------------------------------------------

// Hard‑set the layout engine frame rate.
// WHY: Firefox/Zen on Linux often incorrectly detects 60 Hz or a floating refresh rate.
// This is critical for correct TestUFO behavior and visual smoothness at 165 Hz.
user_pref("layout.frame_rate", 165);

// Enable VSync integration with the Wayland compositor.
// WHY: Ensures synchronized frame delivery to KWin, reducing tearing and phase desync.
user_pref("widget.wayland.vsync.enabled", true);

// Force-enable the Wayland WebRender compositor even if marked as blocklisted.
// WHY: On NVIDIA, Firefox may avoid the Wayland compositor by default, but in our conditions
// (powerful GPU, fresh driver, KWin) this gives more stable frame pacing and true 165 Hz.
user_pref("gfx.webrender.compositor.force-enabled", true);

// Disable partial present.
// WHY: Forces the GPU to redraw the entire frame every time. This increases GPU load,
// but removes micro-stutters and artifacts caused by incorrect dirty-region detection.
user_pref("gfx.webrender.max-partial-present-rects", 0);

// Prevent WebRender from using partial-present via buffer-age.
// WHY: Without this flag, WebRender may still attempt buffer-age partial present,
// causing conflicts and unstable behavior at 165 Hz.
user_pref("gfx.webrender.allow-partial-present-buffer-age", false);



// [SECTION 2: GRAPHICS PIPELINE, DMA-BUF AND GPU PROCESS]
// -----------------------------------------------------------------------------

// Force-enable DMA-BUF (Zero-Copy).
// WHY: Textures are transferred directly from the browser to the GPU, bypassing extra RAM copies.
// This is crucial for 2K @ 165 Hz where per-frame data volume is high.
user_pref("widget.dmabuf.force-enabled", true);

// Enable WebRender for all UI and content.
// WHY: Full hardware-accelerated rendering with no fallback to legacy layers.
user_pref("gfx.webrender.all", true);

// Enable a separate GPU process.
// WHY: If the NVIDIA driver crashes, the browser stays alive — only the GPU process restarts.
user_pref("layers.gpu-process.enabled", true);

// Inform KDE compositor about opaque window regions.
// WHY: KWin can optimize rendering by skipping areas guaranteed to be hidden behind the window.
user_pref("widget.wayland.opaque-region.enabled", true);

// Disable WebRender software fallback.
// WHY: On a powerful GPU there is no reason to fall back to CPU rendering. Such switches cause
// stutters and unstable FPS. We require everything to render through the GPU.
user_pref("gfx.webrender.fallback.software", false);

// Reject software drivers.
// WHY: Ensures only the full GPU driver is used.
user_pref("gfx.webrender.reject-software-driver", true);

// Enable the Warp pipeline for WebRender.
// WHY: Warp reduces pipeline stalls on NVIDIA, especially during fast scrolling, DevTools usage,
// and complex scenes. This stabilizes frame pacing and reduces micro-stutters.
user_pref("gfx.webrender.use-warp", true);

// Disable WebRender shader disk cache.
// WHY: Shaders will be cached only in RAM. This reduces disk I/O and removes stutters caused by
// reading/writing shader binaries. With 62+ GB RAM this is a good tradeoff.
user_pref("gfx.webrender.program-binary-disk", false);



// [SECTION 3: WEBGPU (VULKAN BACKEND, AI/SPA WORKLOADS)]
// -----------------------------------------------------------------------------

// Enable WebGPU.
// WHY: Required for modern graphical web apps, AI tools, and WebGPU demos.
user_pref("dom.webgpu.enabled", true);

// Force Vulkan backend for WebGPU.
// WHY: On Linux + NVIDIA, Vulkan is the native and most performant API.
// OpenGL is slower and auto-selection may be incorrect.
user_pref("dom.webgpu.wgpu-backend", "vulkan");

// Enable detailed hardware/backend labels in about:support.
// WHY: Helps diagnose issues if WebGPU misbehaves.
user_pref("dom.webgpu.hal-labels", true);

// Allow WebGPU inside Service Workers.
// WHY: Enables background computation and complex SPA/AI scenarios running in the background.
user_pref("dom.webgpu.service-workers.enabled", true);

// Disable direct surface present for WebGPU.
// WHY: In previous tests, enabling direct present caused phase desync (red VSYNC indicators).
// Disabling it hands timing control back to the Wayland compositor, giving a more stable result.
user_pref("dom.webgpu.direct-surface-present.enabled", false);



// [SECTION 4: "UNLIMITED MEMORY" STRATEGY (62+ GB RAM, MAXIMUM AGGRESSION)]
// -----------------------------------------------------------------------------

// Fully disable disk cache.
// WHY: On a workstation with 62+ GB RAM, there is no reason to use SSD for tiny cache files.
// This reduces disk I/O and makes behavior more predictable.
user_pref("browser.cache.disk.enable", false);

// Enable RAM cache.
// WHY: Everything that can be cached should live in RAM — the fastest memory tier.
user_pref("browser.cache.memory.enable", true);

// Allocate 4 GB (4194304 KB) for memory cache (scripts, CSS, HTML).
// WHY: Heavy SPA bundles, WASM, and assets will live in RAM, enabling instant reloads.
user_pref("browser.cache.memory.capacity", 4194304);

// Increase max size of a single cache entry to 50 MB.
// WHY: Large JS bundles and WASM modules should also fit into RAM cache.
user_pref("browser.cache.memory.max_entry_size", 51200);

// Allocate 2 GB for decoded images.
// WHY: Store images in "uncompressed" form so fast scrolling has no blank areas or decode delays.
// Critical for feeds, galleries, and design tools.
user_pref("image.mem.max_decoded_image_kb", 2097152);

// Prevent tab unloading on low memory.
// WHY: With 62+ GB RAM, the browser should not unload tabs. We prefer everything to stay in RAM
// for instant switching.
user_pref("browser.tabs.unloadOnLowMemory", false);

// Set memory "panic" threshold to 2 GB free RAM.
// WHY: Only when RAM is truly low should the browser behave cautiously.
user_pref("browser.low_commit_space_threshold_mb", 2048);

// Increase Back/Forward Cache (BFCache).
// WHY: Keep ~16 pages alive for instant Back/Forward navigation.
user_pref("browser.sessionhistory.max_total_viewers", 16);

// Increase session save interval to 30 seconds.
// WHY: Default 15 seconds creates unnecessary disk I/O. On a workstation we can save less often.
user_pref("browser.sessionstore.interval", 30000);



// [SECTION 5: PROCESSES, MULTITHREADING AND IPC (XEON 18C/36T, AGGRESSIVE MODE)]
// -----------------------------------------------------------------------------

// Set content process limit = 24.
// WHY: You have 18 physical cores. 24 processes provide:
// - separate processes for heavy tabs,
// - buffer for background tabs,
// - separate processes for system tasks,
// without excessive context switching.
user_pref("dom.ipc.processCount", 24);

// Set isolated process limit also to 24.
// WHY: Maintains balance between security, isolation, and performance.
user_pref("dom.ipc.processCount.webIsolated", 24);

// Increase extension processes to 8.
// WHY: Many DevTools, blockers, helpers, etc. Should not interfere with each other.
user_pref("dom.ipc.processCount.extension", 8);

// Enable content process prelaunch.
// WHY: Tab processes are prepared in advance, speeding up new tab creation.
user_pref("dom.ipc.processPrelaunch.enabled", true);

// Reduce prelaunch delay to zero.
// WHY: Processes should be ready instantly. On a Xeon, waiting 1000 ms is pointless.
user_pref("dom.ipc.processPrelaunch.delayMs", 0);

// Prioritize the active tab.
// WHY: The tab you're interacting with should get CPU first.
user_pref("dom.ipc.scheduler.useActiveTabPriority", true);

// Disable Firefox's internal process priority manager.
// WHY: With SCX/optimized Linux kernel, the OS scheduler performs better than Firefox’s own logic.
user_pref("dom.ipc.processPriorityManager.enabled", false);

// Enable IPC scheduler preemption.
// WHY: Allows more aggressive task preemption inside IPC, reducing delays between content processes,
// GPU process, and DevTools.
user_pref("dom.ipc.scheduler.preemption", true);

// Increase IPC thread count to 8.
// WHY: Xeon with 36 threads handles additional IPC parallelism easily.
user_pref("dom.ipc.scheduler.threadCount", 8);



// [SECTION 6: JS, WASM AND DEVTOOLS (PERFORMANCE WITHOUT DEBUG MODES)]
// -----------------------------------------------------------------------------

// Enable parallel JavaScript parsing.
// WHY: Xeon excels at multithreading. Parallel parsing uses free cores to compile scripts,
// speeding up heavy SPA loading.
user_pref("javascript.options.parallel_parsing", true);

// Enable WebAssembly.
// WHY: Modern web apps and AI tools rely heavily on WASM. Xeon benefits greatly.
user_pref("javascript.options.wasm", true);

// Increase JS heap high-water mark to 256 MB.
// WHY: Allows the JS heap to grow more before aggressive GC. Reduces GC pauses and micro-stutters
// in complex SPA workloads.
user_pref("javascript.options.mem.high_water_mark", 256);

// Enable WebRender shader precaching.
// WHY: Removes stutters when new graphical elements or complex scenes appear.
user_pref("gfx.webrender.precache-shaders", true);

// Mark that DevTools were opened before.
// WHY: Speeds up first DevTools launch and removes initial delays.
user_pref("devtools.everOpened", true);

// Disable Browser Toolbox and chrome debugging.
// WHY: Previously enabled devtools.chrome.enabled caused huge context menus and enabled debugging
// of the browser UI. We keep DevTools for pages, not for the browser itself.
user_pref("devtools.chrome.enabled", false);

// Disable remote debugging by default.
// WHY: Reduces attack surface and removes extra menu items.
user_pref("devtools.debugger.remote-enabled", false);



// [SECTION 7: NETWORK AND LATENCY (HTTP/3, DNS, PREDICTOR)]
// -----------------------------------------------------------------------------

// Force-enable HTTP/3 (QUIC).
// WHY: Google services (YouTube, AI Studio, etc.) work faster and more stable over QUIC (UDP),
// especially with unstable networks or high RTT.
user_pref("network.http.http3.enable", true);

// Limit persistent connections per server to 10.
// WHY: Conservative setting preventing HTTP/1.1 queue overload and improving predictability
// with many tabs.
user_pref("network.http.max-persistent-connections-per-server", 10);

// Enable predictive DNS/resource loading.
// WHY: Browser resolves domains and prepares connections in advance, speeding up navigation.
user_pref("network.predictor.enabled", true);
user_pref("network.dns.disablePrefetch", false);
user_pref("network.predictor.enable-prefetch", true);

// Enable IPv6 if available.
// WHY: Many modern services work faster over IPv6.
user_pref("network.dns.disableIPv6", false);



// [SECTION 8: UI RESPONSIVENESS, RENDERING AND SCROLLING]
// -----------------------------------------------------------------------------

// Remove artificial delay before first paint.
// WHY: By default, the browser waits 5–250 ms before rendering to "accumulate" data.
// On a powerful Xeon this is unnecessary — we want content ASAP.
user_pref("nglayout.initialpaint.delay", 0);

// Disable decode-on-draw for images.
// WHY: By default, images decode when entering the viewport (RAM saving).
// We prefer decoding in advance to avoid blank areas and delays during fast scrolling.
user_pref("image.mem.decodeondraw", false);

// Enable MSD physics for smooth scrolling.
// WHY: On a 165 Hz monitor, scrolling should be as smooth and physically natural as possible.
user_pref("general.smoothScroll.msdPhysics.enabled", true);

// Remove tabs from the window titlebar.
// WHY: Visual preference and more predictable behavior under KWin.
user_pref("browser.tabs.inTitlebar", 0);

// Always show the bookmarks toolbar.
// WHY: A workstation is about productivity, not saving vertical space.
user_pref("browser.toolbars.bookmarks.visibility", "always");

// Do not let system theme override document colors.
// WHY: Fixes issues with dark themes in some web IDEs and graphical tools.
user_pref("browser.display.document_color_use", 0);



// [SECTION 9: HYGIENE, TELEMETRY AND PRIVACY]
// -----------------------------------------------------------------------------

// Disable usage data submission.
// WHY: On a workstation we prefer predictability and no background activity.
user_pref("datareporting.policy.dataSubmissionEnabled", false);

// Disable health-report upload.
// WHY: Removes unnecessary background requests and writes.
user_pref("datareporting.healthreport.uploadEnabled", false);

// Disable unified telemetry.
// WHY: Minimizes collection and sending of any statistical data.
user_pref("toolkit.telemetry.unified", false);

// Disable telemetry entirely.
// WHY: A fully "quiet" browser with no background analytics.
user_pref("toolkit.telemetry.enabled", false);

// Mark that Global Privacy Control was enabled before.
// WHY: Affects behavior of some sites and trackers.
user_pref("privacy.globalprivacycontrol.was_ever_enabled", true);
