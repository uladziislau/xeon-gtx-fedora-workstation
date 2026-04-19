// =============================================================================
// ZEN BROWSER CONFIG v21 (XEON WAYLAND PERFECTED - ANNOTATED)
// =============================================================================
// СИСТЕМА: Xeon E5-2696 v3 (36 Threads) | 64GB RAM | GTX 1660 SUPER
// ГРАФИКА: NVIDIA Wayland Safe Mode + VP9 HW Video + 165Hz
// =============================================================================

//[СЕКЦИЯ 1: ГРАФИКА (NVIDIA WAYLAND SAFE-MODE & WEBRENDER)]
// -----------------------------------------------------------------------------

// Форсирует использование современного движка рендеринга WebRender (написан на Rust) для всех элементов интерфейса и сайтов.
user_pref("gfx.webrender.all", true);                  
user_pref("gfx.webrender.enabled", true);

// Заставляет браузер игнорировать внутренние "чёрные списки" Mozilla, которые по умолчанию отключают ускорение на драйверах NVIDIA в Linux.
user_pref("layers.acceleration.force-enabled", true);  

// Насильно включает аппаратное ускорение сложных 3D-сцен в браузере (WebGL), перенося нагрузку с Xeon на GTX 1660S.
user_pref("webgl.force-enabled", true);                

// Изолирует работу видеокарты в отдельный процесс (чтобы падение видеодрайвера не закрывало весь браузер).
user_pref("layers.gpu-process.enabled", true);
user_pref("layers.gpu-process.force-enabled", true);

// Включает внутренние костыли (mitigations) браузера для обхода известных багов в проприетарном драйвере NVIDIA.
user_pref("gfx.work-around-driver-bugs", true);

// Запрещает браузеру использовать WARP (программный рендеринг силами процессора) при любых ошибках GPU. Мы требуем использовать только видеокарту.
user_pref("gfx.webrender.use-warp", false);            

// Отдаем WebRender-у 16 потоков процессора для расчета геометрии страниц. Больше 16 ставить нельзя, чтобы не забивать шину данных процессора.
user_pref("gfx.webrender.worker-thread-count", 16);    


//[СЕКЦИЯ 2: ЭКРАН (165Hz & KWIN COMPOSITING FIX)]
// -----------------------------------------------------------------------------

// Значение 0 отключает внутренний лимит в 60 FPS и заставляет браузер синхронизироваться с герцовкой монитора (165 Гц).
user_pref("layout.frame_rate", 0);                     

// Разрешает браузеру использовать нативную вертикальную синхронизацию Wayland, чтобы избежать разрывов кадров (tearing).
user_pref("widget.wayland.vsync.enabled", true);

// Значение 0 запрещает частичную перерисовку зон экрана. На NVIDIA в Wayland это избавляет от артефактов и "мерцающих квадратов" при скроллинге.
user_pref("gfx.webrender.max-partial-present-rects", 0);

// Разрешает браузеру предварительно компилировать шейдеры страниц, чтобы избежать подтормаживаний в первые секунды загрузки сайта.
user_pref("gfx.webrender.precache-shaders", true);

// Сохраняет скомпилированные шейдеры на диск/в кэш. Снимает задачу перекомпиляции с процессора при повторном открытии сайтов.
user_pref("gfx.webrender.program-binary-disk", true);  

//[ЗАЩИТА ОТ КРАШЕЙ]: Запрещает браузеру делегировать отрисовку окон композитору KDE (KWin). 
// Это спасает сеанс от ошибки "Wayland protocol error 7: dmabufs failed", возникающей из-за багов драйвера NVIDIA.
user_pref("gfx.webrender.compositor", false);           
user_pref("gfx.webrender.compositor.force-enabled", false);


//[СЕКЦИЯ 3: ЦВЕТ И ШРИФТЫ (HDR 10-BIT)]
// -----------------------------------------------------------------------------

// Значение "-1" делегирует масштаб интерфейса (DPI) напрямую Wayland, избегая мыла на мониторах с высоким разрешением.
user_pref("layout.css.devPixelsPerPx", "-1");          

// Форсирует субпиксельное сглаживание шрифтов в WebRender, делая текст максимально четким (без "лесенок").
user_pref("gfx.webrender.quality.force-subpixel-aa-where-possible", true);
user_pref("gfx.text.disable-aa", false);

// Устанавливает библиотеку Skia в качестве главного бэкенда для отрисовки всех 2D-элементов.
user_pref("gfx.content.azure.backends", "skia");

// Активирует полноформатное управление цветом (Color Management), включая поддержку расширенных цветовых профилей ICC v4 (важно для правильных цветов фотографий).
user_pref("gfx.color_management.mode", 1);
user_pref("gfx.color_management.enablev4", true);
user_pref("gfx.color_management.native_srgb", true);

// Разрешает браузеру использовать 10-битную глубину цвета (если поддерживается монитором), избавляя градиенты от полос (бандинга).
user_pref("gfx.webrender.10bit-format", true);


//[СЕКЦИЯ 4: КАНВАС И 2D (PERFORMANCE)]
// -----------------------------------------------------------------------------

// Включает аппаратное (через GPU) ускорение HTML5-элемента Canvas (используется в браузерных играх, Яндекс/Google Картах, графиках).
user_pref("gfx.canvas.accelerated", true);

// Выделяет гигантский пул (65 тысяч элементов и 4 Гигабайта видеопамяти) для хранения Canvas-текстур в памяти видеокарты.
user_pref("gfx.canvas.accelerated.cache-items", 65536);
user_pref("gfx.canvas.accelerated.cache-size", 4096);  

// Сохраняет геометрию страниц и интерфейса браузера в памяти, чтобы мгновенно их перерисовывать при прокрутке.
user_pref("layout.display-list.retain", true);
user_pref("layout.display-list.retain.chrome", true);
user_pref("layers.tiles.max-pool-size", 64);

// Выносит WebGL в отдельный изолированный поток, предотвращая фризы интерфейса на "тяжелых" сайтах с 3D-графикой.
user_pref("webgl.out-of-process", true);               


//[СЕКЦИЯ 5: ВИДЕО (VP9 HW ACCELERATION FIX)]
// -----------------------------------------------------------------------------

// Включает транслятор VA-API, который позволяет Linux отправлять видеопоток в блок раскодирования (NVDEC) вашей видеокарты NVIDIA.
user_pref("media.ffmpeg.vaapi.enabled", true);         

// Значение 'false' отключает агрессивное форсирование кодеков, позволяя системе самой договориться с видеокартой о том, что она умеет декодировать.
user_pref("media.hardware-video-decoding.force-enabled", false); 

// Значение '0' спасает проприетарный драйвер NVIDIA от "Segmentation Fault", заставляя безопасно копировать готовые кадры видео из видеокарты обратно в системную RAM.
user_pref("media.ffmpeg.vaapi.force-surface-zero-copy", 0); 

// Выключает внутренний софтовый декодер браузера (ffvpx) и заставляет его использовать системный декодер FFmpeg с поддержкой аппаратного ускорения.
user_pref("media.ffvpx.enabled", false);               
user_pref("media.prefer-non-ffvpx", true);             
user_pref("media.rdd-ffmpeg.enabled", true);

// Убирает песочницу (изоляцию) процесса RDD, чтобы драйвер NVIDIA мог получить доступ к системным устройствам (например, /dev/dri/renderD128).
user_pref("security.sandbox.rdd.level", 0);            
user_pref("media.rdd-vpx.enabled", false);             

//[ГЛАВНЫЙ ФИКС ДЛЯ GTX 1660 SUPER]: Эта видеокарта не поддерживает аппаратное декодирование AV1. 
// Значение 'false' сообщает об этом YouTube, заставляя его отдавать видео в кодеке VP9, который аппаратно поддерживается на 100%.
user_pref("media.av1.enabled", false);                 


//[СЕКЦИЯ 6: XEON 36-THREADS (БАЛАНС IPC И GC)]
// -----------------------------------------------------------------------------

// Ограничивает количество процессов браузера до 16. Предотвращает переполнение кэша процессора (L3) от чрезмерной передачи данных между ядрами Xeon.
user_pref("dom.ipc.processCount", 16);
user_pref("dom.ipc.processCount.webIsolated", 16);

// Разрешает распараллеливать чтение и обработку JavaScript (JS) и WebAssembly на несколько потоков процессора.
user_pref("javascript.options.parallel_parsing", true);
user_pref("javascript.options.wasm", true);

// Устанавливает лимит для фоновых воркеров сайтов, позволяя им использовать до 36 потоков процессора в сумме.
user_pref("dom.workers.max_per_domain", 36);
user_pref("dom.worker.limit", 36);

// Ограничивает количество потоков для декодирования картинок до 1 (что равно 36 потокам суммарно). Спасает ядро ОС от "Thread Thrashing" (смерти от переключения контекстов).
user_pref("image.parallel.decode.limit.multiplier", 1); 

// Заставляет браузер отдавать максимальный приоритет вкладке, на которую вы смотрите прямо сейчас.
user_pref("dom.ipc.scheduler.useActiveTabPriority", true);

// Разрешает браузеру использовать системные (Linux) планировщики для удушения фоновых вкладок (перевод их в энергоэффективный режим QoS).
user_pref("dom.ipc.processPriorityManager.enabled", true);              
user_pref("dom.ipc.processPriorityManager.backgroundUsesEcoQoS", true); 

//[СБОРЩИК МУСОРА JS]: Ограничивает накопление мусора (старых данных скриптов) в RAM до 1 ГБ (1024 МБ). 
// Если поставить больше - процессор будет "давиться" и зависать на секунду при каждой очистке.
user_pref("javascript.options.mem.high_water_mark", 1024);              
user_pref("javascript.options.mem.gc_allocation_threshold_mb", 100);    

// Заставляет сборщик мусора работать микро-рывками по 10 миллисекунд, чтобы очистка памяти была полностью незаметна на вашем 165Hz мониторе.
user_pref("javascript.options.mem.gc_incremental_slice_ms", 10);        


// [СЕКЦИЯ 7: 64GB RAM (RAMDISK MODE & BFCache)]
// -----------------------------------------------------------------------------

// Полностью отключает кэширование сайтов на SSD. Бережет ресурс диска, т.к. всё переносится в оперативную память.
user_pref("browser.cache.disk.enable", false);           
user_pref("browser.cache.memory.enable", true);

// Выделяет ровно 16 Гигабайт ОЗУ под кэш браузера (больше ставить нельзя из-за ограничений 32-битного целочисленного типа в коде браузера).
user_pref("browser.cache.memory.capacity", 16777216);    

// Значение '-1' разрешает браузеру кэшировать в оперативную память файлы АБСОЛЮТНО ЛЮБОГО РАЗМЕРА (например, целые видеоролики или аудио-файлы).
user_pref("browser.cache.memory.max_entry_size", -1);    

// Выделяет 8 ГБ ОЗУ чисто для хранения уже раскодированных, готовых к отрисовке картинок, чтобы при скроллинге вниз-вверх не грузить процессор повторно.
user_pref("image.mem.max_decoded_image_kb", 8388608);    

//[BFCache]: Замораживает и держит в ОЗУ до 50 последних закрытых (или перейденных) страниц. Нажатие кнопки "Назад" будет происходить мгновенно, без перерендеринга.
user_pref("browser.sessionhistory.max_total_viewers", 50); 

// Запрещает браузеру "усыплять" и выгружать фоновые вкладки для экономии памяти. При 64 ГБ ОЗУ экономия не нужна.
user_pref("browser.tabs.unloadOnLowMemory", false);      

// Указывает браузеру не начинать паническую выгрузку вкладок до тех пор, пока в системе (Linux) не останется менее 1 ГБ свободной ОЗУ.
user_pref("browser.low_commit_space_threshold_mb", 1024);


//[СЕКЦИЯ 7.1: MEDIA CACHE (YOUTUBE / TWITCH В RAM)]
// -----------------------------------------------------------------------------

// Выделяет 4 Гигабайта ОЗУ для буферизации воспроизводимого видео (т.к. дисковый кэш у нас выключен).
user_pref("media.memory_cache_max_size", 4194304);             

// Суммарный лимит ОЗУ для буферов всех вкладок с медиа (до 8 ГБ).
user_pref("media.memory_caches_combined_limit_kb", 8388608);   

// Разрешает браузеру забрать до 20% всей ОЗУ системы (около 12 ГБ из ваших 64 ГБ) сугубо под кэширование видео-потока.
user_pref("media.memory_caches_combined_limit_pc_sysmem", 20); 

// Снимает лимиты на буферизацию. Браузер будет скачивать видео наперед с той максимальной скоростью, которую позволяет ваш провайдер.
user_pref("media.cache_readahead_limit", 99999);               
user_pref("media.cache_resume_threshold", 99999);


//[СЕКЦИЯ 8: СЕТЬ, LATENCY И МАКСИМАЛЬНЫЙ ПАРАЛЛЕЛИЗМ]
// -----------------------------------------------------------------------------
user_pref("network.http.http3.enable", true);
user_pref("network.predictor.enabled", true);
user_pref("network.predictor.enable-prefetch", true);

// [FIX]: ОТКЛЮЧАЕМ ОЧЕРЕДИ (NETWORK TAILING)
// Это главная настройка, которая заставляет браузер ждать. Отключаем её,
// чтобы play.google.com и fonts.gstatic.com грузились ОДНОВРЕМЕННО.
user_pref("network.http.tailing.enabled", false); 

// [FIX]: ОТКЛЮЧАЕМ ПЕЙСИНГ (REQUEST PACING)
// Пейсинг ограничивает количество запросов в секунду, чтобы не забивать канал.
// На мощной рабочей станции это не нужно — нам нужна вся скорость сразу.
user_pref("network.http.pacing.requests.enabled", false);

// [PARALLEL DNS]: Разрешаем Xeon делать до 36 DNS-запросов одновременно (по числу потоков).
// Стандартно в Firefox стоит 20, что может создавать очередь на этапе резолва IP.
user_pref("network.dns.parallelLookupCount", 36);

// Увеличиваем лимит соединений на один сервер. Для Google-сервисов (которые висят на одних IP) 
// 12 бывает мало. Поднимем до 20 — это безопасно и асинхронно.
user_pref("network.http.max-persistent-connections-per-server", 20);
user_pref("network.http.max-connections", 1500);

// Ускоряем приоритезацию HTTP/2 и HTTP/3, чтобы контент и шрифты шли в одном потоке данных.
user_pref("network.http.http2.priority_updates", true);
user_pref("network.http.http3.priority_updates", true);

// Уменьшаем задержки при установке TLS-соединения (False Start).
user_pref("security.ssl.enable_false_start", true);

// Агрессивная предзагрузка DNS и TCP
user_pref("network.dns.disablePrefetch", false);
user_pref("network.prefetch-next", true);
user_pref("network.http.speculative-parallel-limit", 24); // Больше параллельных попыток
user_pref("network.dnsCacheEntries", 20000);
user_pref("network.dnsCacheExpiration", 3600);

// Убираем задержку перед первой отрисовкой
user_pref("nglayout.initialpaint.delay", 0); 
user_pref("content.notify.interval", 0);
user_pref("content.notify.ontimer", true);           


//[СЕКЦИЯ 9: ГИГИЕНА (ОТКЛЮЧЕНИЕ ТЕЛЕМЕТРИИ)]
// -----------------------------------------------------------------------------

// Жестко блокирует отправку отчетов, телеметрии и краш-репортов на серверы Mozilla. Экономит сокеты, трафик и процессорное время.
user_pref("datareporting.policy.dataSubmissionEnabled", false);
user_pref("datareporting.healthreport.uploadEnabled", false);
user_pref("toolkit.telemetry.unified", false);
user_pref("toolkit.telemetry.enabled", false);

// Активирует флаг Global Privacy Control, сообщая всем сайтам требование не продавать ваши данные рекламным брокерам.
user_pref("privacy.globalprivacycontrol.was_ever_enabled", true);

// Отключает скрытые A/B тесты и "экспериментальные функции", которые Mozilla иногда применяет на случайных пользователях в фоне.
user_pref("app.shield.optoutstudies.enabled", false);
user_pref("app.normandy.enabled", false); 

//[КРИТИЧНО ДЛЯ LINUX]: Значение '1' вырывает с корнем встроенный движок доступности (Screen Readers). 
// Это известная причина фризов на Linux, когда сторонние демоны пытаются "просканировать" интерфейс браузера.
user_pref("accessibility.force_disabled", 1);

//[СЕКЦИЯ 10: ЗВУКОВАЯ ПОДСИСТЕМА (PIPEWIRE/PULSE FIX)]
// -----------------------------------------------------------------------------

// Переносит декодирование аудио в отдельный изолированный процесс. 
// Это повышает стабильность: если "чихнет" аудио-драйвер, вкладка не упадет.
user_pref("media.utility-process.enabled", true);
user_pref("media.utility-process.audio-decoding.enabled", true);

// Помогает Cubeb быстрее инициализироваться в средах PipeWire (CachyOS/Fedora).
user_pref("media.cubeb.sandbox", false); 

// Принудительно ограничивает количество аудио-каналов до 2 (стерео). 
// В вашем логе было "число каналов: 0", что путает браузер. Это форсирует стандарт.
user_pref("media.audio-max-channels", 2);

// Отключает внутреннюю обработку звука (подавление эха, шумов), которую браузер 
// пытается делать программно. В KDE/PipeWire это только мешает и жрет такты Xeon.
user_pref("media.audioproc.enabled", false);