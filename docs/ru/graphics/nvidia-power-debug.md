# Расследование энергопотребления NVIDIA GPU в простое

**Дата:** 2026-06-21 — 2026-06-22
**Система:** Fedora 44 KDE, CachyOS 7.0.11, NVIDIA 595.58.03 (nvidia-open)
**GPU:** GTX 1660 SUPER, 2560×1440 @ 165 Гц (DP-3)
**Сессия:** Wayland (KWin 6.7.0) / X11

## Симптом

Энергопотребление в простое выросло с **~24 Вт** до **~49 Вт** после обновления
системы. GPU застрял на **P0**, частота памяти **7000 МГц**.
**Раньше на Wayland при 165 Гц работало нормально — это регрессия.**

## Прогресс (22.06.2026)

### Этап 1: flip-rate hypothesis ✅
**Найдено:** P-state коррелирует с частотой обновления на Wayland.

| Частота | P-state | Память | Мощность |
|---------|:-------:|:------:|:--------:|
| 60 Гц | P8 | 405 MHz | **21W** |
| 120 Гц | P8 | 405 MHz | **22W** |
| 144 Гц | P0 | 7000 MHz | **43W** |
| 165 Гц | P0 | 7000 MHz | **44W** |
| X11 165 Гц | P8 | 405 MHz | **21W** |

**Порог P0:** между 120 и 144 Гц.

### Этап 2: GSP firmware — RMAPI dead end ✅
Все `NV2080_CTRL_CMD_PERF_*` команды (AGGRESSIVE_PSTATE, GPU_IS_IDLE,
SET_POWERSTATE) — `ret=86` или `ret=0` без эффекта.
GSP firmware автономен, патчить nvidia-open для P-state бесполезно.

### Этап 3: bpftrace — считаем atomic commits ✅
Использован `bpftrace` для подсчёта `DRM_IOCTL_MODE_ATOMIC` (= 0xC03864BC)
в `kwin_wayland`:

| Режим | DRM_IOCTL_MODE_ATOMIC/sec | nv_drm_atomic_commit/sec | P-state |
|-------|--------------------------:|-------------------------:|:-------:|
| 60 Гц | **~95-102** | — | P8 |
| 120 Гц | **~95-102** | — | P8 |
| 165 Гц | **~114-128** | **~61-64** | P0 |
| X11 165 Гц | **0** | **0** | **P8** |

**Соотношение 2:1** — на каждый вызов `nv_drm_atomic_commit` приходится 2 ioctl
вызова. Возможно: test-only + commit, или cursor + primary plane.

**Ключевое открытие:** KWin **НЕ** делает atomic commit каждый vsync.
Коммиты не отслеживают частоту обновления линейно (~100 на 60 Гц vs ~126 на 165 Гц).
Порог P0 между ~102 и ~114 commits/sec.

**X11 = 0 DRM операций** — Xorg идёт через nvidia-modeset API напрямую, минуя
DRM полностью. GSP firmware не видит активности → P8.

### Текущая гипотеза
GSP firmware триггерит P0 от количества DRM atomic операций через
`nvidia-drm`. На X11 DRM ioctls = 0 (Xorg идёт через `nvidia-modeset` в обход
DRM) → P8. На Wayland KWin шлёт ~126 DRM_IOCTL_MODE_ATOMIC/sec → P0.

**GSP firmware считает DRM atomic ioctls, а не аппаратные vsync'и.**
X11 при тех же 165 Hz имеет 0 DRM ioctls → P8, подтверждая это.

### Что дальше
- [ ] ~~`KWIN_DRM_NO_AMS=1`~~ — **FAIL**: NVIDIA EGLStreams несовместим с legacy drmModePageFlip
- [ ] ~~`KWIN_FORCE_SW_CURSOR=1`~~ — **FAIL**: тоже ломает KWin
- [ ] GSP firmware логи — не настроены (конфиг запорот), требует reboot
- [ ] Сравнить KWin 6.6 vs 6.7 DRM backend
- [ ] Патчить KWin: уменьшить количество atomic commits ниже порога (~110/sec)
      — мержить/батчить commits, убрать лишние test-only commits

### Проверено — не помогло
| # | Метод | Результат |
|---|---|---|
| 1 | Откат драйвера 595→580 | P0, 7000 МГц |
| 2 | DPM=0x01 | P0 |
| 3 | DPM порог 512 MB | P0 |
| 4 | KWIN_COMPOSE=O2ES | P0 |
| 5 | nvidia-smi -c 2 (запрет compute) | P0 |
| 6 | nvidia-powerd.service | не влияет на Туринг |
| 7 | GSP firmware OFF | P0 |
| 8 | RegistryDwords PowerMizer | P0 |
| 9 | X11 сессия | **P8** ✅ |
| 10 | AGGRESSIVE_PSTATE_NOTIFY | ret=86 |
| 11 | GPU_IS_IDLE | ret=86 |
| 12 | SET_POWERSTATE(battery) | ret=0, ignored |
| 13 | KWIN_DRM_MAX_FPS=60 | P0 (flips остаются) |
| 14 | 60 Гц на Wayland (595) | **P8** ✅ |
| 15 | 120 Гц на Wayland (595) | **P8** ✅ |
| 16 | 144 Гц на Wayland (595) | P0 |
| 17 | bpftrace: подсчёт atomic commits | ~100-126/sec на Wayland |
| 18 | KWIN_DRM_NO_AMS=1 | KWin падает (EGLStreams + legacy) |
| 19 | KWIN_FORCE_SW_CURSOR=1 | KWin падает |



## Детальное расследование

### 1. Откат на NVIDIA 580.159.04 (22.06.2026)

**Команды:**
```bash
sudo dnf swap 'xorg-x11-drv-nvidia-*' 'xorg-x11-drv-nvidia-580xx-*' --allowerasing
sudo dnf swap 'nvidia-settings' 'nvidia-settings-580xx'
sudo dnf install akmod-nvidia-580xx
```

**Результат:** Драйвер установлен, модуль ядра собран для CachyOS 7.0.12, но P0
и 44 Вт сохранились. На 580xx параметр `DynamicPowerManagement` по умолчанию = 3
(auto), явная установка 0x01 не изменила поведение.

### 2. DPM (Dynamic Power Management) — 22.06.2026

```bash
# /etc/modprobe.d/nvidia-dpm.conf
options nvidia NVreg_DynamicPowerManagement=0x01
options nvidia NVreg_DynamicPowerManagementVideoMemoryThreshold=512
```

Параметр `DynamicPowerManagementVideoMemoryThreshold` (порог в MB) определяет,
при каком объёме занятой VRAM разрешено снижение частоты памяти.
Значение по умолчанию: 200 MB. При занятой VRAM > 200 MB DPM отключается.

- Текущая занятая VRAM: ~273-374 MB (KWin 30 MB + plasmashell 200 MB + Xwayland
  2 MB + прочее)
- Поднятие порога до 512 MB: параметр применился, но частота памяти не снизилась
- Вывод: на десктопном Туринге GDDR6 не переключается в 405 MHz даже с DPM=1,
  если активен вывод изображения

### 3. KWIN_COMPOSE=O2ES — 22.06.2026

```bash
# ~/.config/environment.d/kwin.conf
KWIN_COMPOSE=O2ES
```

KWin переключился на OpenGL ES 2.0 (подтверждено через D-Bus:
`Compositing Type: OpenGL ES 2.0`), но `C+G` и P0 сохранились. Compute-контекст
не связан с версией OpenGL — он создаётся на уровне EGL независимо от API.

### 4. Запрет compute-контекстов (nvidia-smi -c 2) — 22.06.2026

```bash
sudo nvidia-smi -c 2  # PROHIBITED
kwin_wayland --replace
```

После запрета compute-контекстов и рестарта KWin:
- nvidia-smi pmon: `C+G` → `G` (compute исчез)
- Мощность: **44 Вт** (без изменений)
- Вывод: **C не был причиной P0.** GPU остаётся в P0 независимо от compute.

`C` в `C+G` означал, что NVIDIA EGL открывал CUDA-контекст для внутренних нужд
(вероятно, explicit sync). Сам KWin не использует CUDA напрямую (нет libcuda в
maps процесса). Блокировка compute безопасна — функциональность KWin не страдает.

### 5. nvidia-powerd.service — 22.06.2026

```bash
sudo systemctl enable --now nvidia-powerd.service
```

Демон Dynamic Power Management от NVIDIA. На Туринге (TU116) завершается сразу
после запуска с кодом 1 (неподдерживаемое оборудование). Работает только на GPU
Ada Lovelace (RTX 4000) и новее.

### 6. Тест 165 Гц → 60 Гц — 22.06.2026 (перепроверен на 595)

```bash
xrandr --output DP-3 --mode 2560x1440 --rate 60
```

**На 580.159.04:** Мощность не изменилась. P0, 7000 МГц.
**На 595.58.03:** **P8, 405 МГц, 21W** ✅ — полный успех!

**Разница между драйверами:** на 580 снижение герцовки не помогало (P0), на 595
— помогает (P8). Это объясняет почему пользователи бага #5474539 на 570+ видели P0
независимо от герцовки — на 580 поведение такое же. На 595 поведение изменилось:
60 Гц → P8.

### 7. GSP firmware OFF (EnableGpuFirmware=0) — 22.06.2026

```bash
# /etc/modprobe.d/nvidia-no-gsp.conf
options nvidia NVreg_EnableGpuFirmware=0
```

GSP — RISC-V процессор внутри GPU, управляющий питанием и дисплеем.
Отключение перекладывает управление P-state с бинарного блоба на модуль ядра.

**Результат:** GSP выключен (подтверждено `EnableGpuFirmware: 0`), но P0, 44W,
7000 MHz не изменились. GSP не является причиной P0.

### 8. RegistryDwords PowerMizer — 22.06.2026

```bash
# /etc/modprobe.d/nvidia-powermizer.conf
options nvidia NVreg_RegistryDwords="PowerMizerEnable=0x1; PowerMizerDefault=0x2"
```

Принудительное включение PowerMizer в адаптивном режиме через реестр NVIDIA.
**Результат:** см. заключение.

### 10. X11 сессия (Plasma X11) — 22.06.2026

После перехода с Wayland на X11 (Plasma X11 в SDDM):

**Результат (X11, nvidia-open 595.58.03):**
- P-state: **P8** (кратковременно P5) ✅
- Память: **405-810 МГц** ✅
- Мощность: **~21-26 Вт** ✅
- GPU Util: **25%** (kwin_x11), **P8/P5 при 25% нагрузки!**

### 12. X11 vs Wayland — детальное сравнение (22.06.2026)

Собраны метрики на X11 для прямого сравнения с Wayland:

| Метрика | X11 (P5) | Wayland (P0) |
|---------|----------|--------------|
| P-state | **P5** | **P0** |
| Мощность | **29 Вт** | **47 Вт** |
| Core clock | 645-990 МГц | 1170-1530 МГц |
| Memory clock | **810 МГц** | **7000 МГц** |
| GPU Util (KWin) | 25% (type **G**) | 18-20% (type **C+G**) |
| GPU Util (всего) | 25% | 21-30% |
| IMP minImpVPState | **P6** | **P6** |
| KWin compositing | gl2 | gl2 |
| KWin refresh | 165000 | 165000 |
| Xorg процесс | Да (3.4% CPU) | Нет (только Xwayland) |
| OpenGL interface | GLX | EGL |
| Clocks Event Reasons | Idle: Active | Idle: Active |
| Display Clock Setting | Not Active | Not Active |

**Ключевая находка:** GPU Utilization на X11 (25%) **ВЫШЕ** чем на Wayland (18-20%),
но при этом на X11 GPU в P5, а на Wayland в P0.

**P-state НЕ зависит от процента GPU utilization.** При 25% нагрузки на P5
и при 18% нагрузки на P0 — разница не в количестве, а в типе работы.

**Основные различия (исторически — потенциальные причины P0 на Wayland,**
**опровергнуты bpftrace):**
1. **Memory clock: 810 vs 7000 МГц** — главный потребитель энергии
2. **OpenGL interface: GLX vs EGL** — разный путь рендеринга
   *(опровергнуто: 60 Гц Wayland (EGL) → P8)*
3. **Тип контекста: G vs C+G** — EGL на Wayland создаёт compute-контекст
   *(опровергнуто: nvidia-smi -c 2 убрал C, P0 остался)*
4. **Xorg отсутствует на Wayland** — KWin сам инициализирует дисплей
   *(подтверждается: Xorg использует legacy path без atomic)*

### 13. KWIN_DRM_MAX_FPS=60 — эксперимент (22.06.2026)

Установлен `KWIN_DRM_MAX_FPS=60` в `/etc/environment`. После перезагрузки:

**Результат:**
- KWin_wayland: **0% GPU** ✅ (было 18-20%)
- GPU Util (всего): **21%** (warp-terminal 19%)
- P-state: **P0** (не изменился — warp-terminal держит нагрузку)
- Мощность: **47 Вт**

**Вывод:** KWIN_DRM_MAX_FPS=60 **работает** — KWin перестал грузить GPU.
Но общая утилизация остаётся высокой из-за других приложений (warp-terminal
с C+G). P-state не падает пока хотя бы одно приложение использует GPU.

**Ожидание (требует проверки на Wayland):** если закрыть все GPU-приложения
(warp-terminal, виджеты) на Wayland с KWIN_DRM_MAX_FPS=60 — GPU должен уйти
в P5/P8, как на X11.

### 14. X11 — прорыв: P8 достижим на 595 (22.06.2026)

При тестировании на X11 обнаружено:

**GPU стабильно переключается между P8 и P5 на X11:**

| Время | P-state | Memory | Power | kwin_x11 SM | 
|-------|---------|--------|-------|-------------|
| t+0   | **P8**  | 405 MHz | 21.1W | 16% (пик) |
| t+2   | **P8**  | 405 MHz | 20.9W | 13% (пик) |
| t+4   | **P8**  | 405 MHz | 22.0W | 0% (idle) |
| t+6   | **P5**  | 810 MHz | 20.9W | 0% (кратковременно) |
| t+8   | **P8**  | 405 MHz | 21.9W | 0% (idle) |

**Ключевые открытия:**
1. **P8 НЕ ЗАБЛОКИРОВАН на NVIDIA 595 open.** GPU достигает P8 (405 MHz) на X11
   **и на Wayland при ≤120 Гц.**
2. **GSP firmware корректно переключает P-state** — но только при низкой частоте
   atomic page flip событий (≈<140 commits/sec).
3. **Шаблон нагрузки:** X11 — 0 atomic flips (Xorg через legacy nvidia-modeset) → P8.
   Wayland 165 Гц — ~120 atomic commits/sec → P0.
   Wayland 60 Гц — ~100 atomic commits/sec → P8.

### 15. X11 DRM ioctls = 0 — подтверждение архитектуры (22.06.2026)

На X11 при 165 Гц запущен bpftrace на все DRM ioctls:

```bpftrace
# все ioctl с кодом 0x64XX (DRM)
tracepoint:syscalls:sys_enter_ioctl
/args->fd >= 0 && (args->cmd & 0xFF00) == 0x6400/
```

**Результат за 10 секунд:** всё = 0. Ни одного DRM ioctl.
- `DRM_IOCTL_MODE_ATOMIC`: 0
- `DRM_IOCTL_MODE_PAGE_FLIP`: 0
- `DRM_IOCTL_MODE_SETCRTC`: 0
- Любые другие DRM ioctl: 0

**GSP firmware не имеет доступа к nvidia-modeset операциям — он видит только
DRM-путь.** Xorg работает через nvidia-modeset напрямую, минуя DRM целиком.

**Соотношение 2:1 DRM_IOCTL_MODE_ATOMIC : nv_drm_atomic_commit:**
- `kprobe:nv_drm_atomic_commit`: ~63/sec
- `tracepoint:syscalls:sys_enter_ioctl` with `cmd == 0xC03864BC`: ~126/sec

Вероятно: test-only atomic commit + actual commit, или два раздельных commit
(например, primary plane + cursor plane) на каждый вызов nv_drm_atomic_commit.
Это объясняет почему `KWIN_FORCE_SW_CURSOR=1` не сработал — соотношение 2:1
не связано с курсором.

**drm_atomic_commit (fentry) vs nv_drm_atomic_commit (kprobe):**
- `fentry:drm_atomic_commit`: 0/sec — NVIDIA не вызывает core DRM atomic
- `kprobe:nv_drm_atomic_commit`: ~63/sec — NVIDIA имеет собственную реализацию

NVIDIA driver (`nvidia_drm.ko`) переопределяет ioctl handlers в DRM core,
поэтому `drm_atomic_commit` не вызывается.

### 16. Анализ архитектуры P-state на GSP firmware (22.06.2026)

Все RMAPI-команды управления P-state из nvidia-modeset протестированы:

| Команда | Результат | Вывод |
|---------|-----------|-------|
| `NV2080_CTRL_CMD_PERF_AGGRESSIVE_PSTATE_NOTIFY` | `ret=86` (NV_ERR_NOT_SUPPORTED) | GSP не реализует |
| `NV2080_CTRL_CMD_PERF_GPU_IS_IDLE` | `ret=86` (NV_ERR_NOT_SUPPORTED) | GSP не реализует |
| `NV2080_CTRL_CMD_PERF_SET_POWERSTATE(battery)` | `ret=0` (NV_OK), но без эффекта | GSP игнорирует |

**GSP firmware автономно управляет P-state и не принимает внешних команд.**



## Команды для диагностики

### Базовая проверка
```bash
nvidia-smi                                          # общее состояние
nvidia-smi -q -d POWER                              # энергопотребление
nvidia-smi -q -d CLOCK                              # частоты
nvidia-smi -q -d PERFORMANCE                        # P-state и причины
nvidia-smi pmon -c 5                                # использование по процессам
nvidia-settings -q GPUPowerMizerMode -t             # 0=Adaptive, 1=PreferMax, 2=Auto
nvidia-settings -q GPUPerfModes                     # доступные P-состояния
nvidia-settings -q GPUCurrentClockFreqsString       # текущие частоты
```

### Профили энергопотребления
```bash
powerprofilesctl get                                # текущий профиль
powerprofilesctl set balanced                       # сбалансированный
powerprofilesctl set power-saver                    # энергосбережение
```

### Мониторинг процессов в реальном времени
```bash
nvidia-smi pmon -d 2                                # непрерывный мониторинг
```

### Типы контекстов в nvidia-smi pmon
```
C  — Compute (CUDA, OpenCL, Vulkan compute)
G  — Graphics (OpenGL, Vulkan graphics)
C+G — и то и другое
```

### Доступные P-состояния (GTX 1660 SUPER)
| Уровень | Ядро | Память | Описание |
|---|---|---|---|
| perf=0 | 300 МГц | 405 МГц | **P8** — достижим на 595 при 60 Гц Wayland или X11 |
| perf=1 | 300 МГц | 810 МГц | |
| perf=2 | 300 МГц | 5001 МГц | |
| perf=3 | 300 МГц | 6801 МГц | |
| perf=4 | 300 МГц | 7001 МГц | P0 — при 165 Гц Wayland |

### Ключевые индикаторы в `nvidia-smi -q -d PERFORMANCE`
```
Performance State: P0
Clocks Event Reasons:
    Idle: Active                → GPU знает что простаивает
    Display Clock Setting: Not Active → дисплей НЕ причина P0
```

### Параметры модуля nvidia (проверенные)
```bash
cat /proc/driver/nvidia/params | grep -E 'Dynamic|Power|Cuda|Modeset'

DynamicPowerManagement: 1              # 0x01 принудительно
DynamicPowerManagementVideoMemoryThreshold: 512  # порог VRAM
EnableS0ixPowerManagement: 0           # S0ix для suspend, не idle
```

## Ссылки

- [Изменение P-state в драйвере 595 (Treeru)](https://treeru.com/en/blog/nvidia-driver-595-blackwell-upgrade)
- [Релиз KDE Plasma 6.7.0](https://kde.org/announcements/plasma/6/6.7.0/)
- [KWin Environment Variables](https://community.kde.org/KWin/Environment_Variables)
