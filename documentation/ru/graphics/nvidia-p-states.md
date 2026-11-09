# P-состояния NVIDIA (P-states)

P-state (Performance State) — уровень производительности GPU.
Чем ниже номер — тем выше производительность и энергопотребление.
Диапазон: от **P0** (максимум) до **P12** (минимум).

## Шкала P-states

| State | Название | Когда используется |
|---|---|---|
| **P0** | Maximum performance | Игры, CUDA, рендеринг |
| **P1** | High performance | Тяжёлые нагрузки |
| **P2** | Balanced | Средние нагрузки |
| P3-P7 | Intermediate | Используется редко |
| **P6** | Low-intermediate | IMP-валидация на GTX 1660 SUPER выдает P6 для 1920x1080@60 |
| **P8** | Low power idle | **X11 или Wayland ≤120 Гц на 595. На 580+ не достигался** |
| P10-P11 | Deep idle | Экономия батареи |
| **P12** | Minimum power | **Дисплей выключен, глубокий сон** |

**Важно (опыт GTX 1660 SUPER, 2026):** P8 с памятью 405 МГц — достижим
на **595** при:
- X11 (любая герцовка, ~0 atomic commits/sec)
- Wayland ≤120 Гц (~100-120 atomic commits/sec)
- **НЕ достижим** на Wayland ≥144 Гц (GSP держит P0)

На драйверах **580 series** P8 не достижим ни при каких условиях с дисплеем.

## Пример: GTX 1660 SUPER

| State | Ядро | Память | Типичная мощность |
|---|---|---|---|
| **P0** | 300-2160 МГц | 7001 МГц | 44-125 Вт (44 Вт idle) |
| P2 | 300-1500 МГц | 5001 МГц | ~40-60 Вт |
| **P5** | 300 МГц | 810 МГц | **~26 Вт (X11 idle)** |
| **P6** | 300 МГц | 810 МГц | ~26 Вт (возвращается IMP как minimum) |
| **P8** | **300 МГц** | **405 МГц** | **15-24 Вт** ← достижим на 595: X11 / Wayland ≤120 Гц |
| P12 | 0 МГц | 0 МГц | ~5 Вт |

## Доступные уровни GTX 1660 SUPER

```
perf=0: nvclock=300,  memclock=405   ← P8 (idle)
perf=1: nvclock=300,  memclock=810   ← P5/P6
perf=2: nvclock=300,  memclock=5001
perf=3: nvclock=300,  memclock=6801
perf=4: nvclock=300,  memclock=7001   ← P0 (max)
```

## Как работает

GPU имеет независимые домены питания:
- **Graphics (ядро)** — частота и напряжение меняются динамически
- **Memory (память)** — дискретные уровни (405/810/5001/6801/7001 МГц)
- **Video (видео)** — отдельный блок для encode/decode
- **Display (дисплей)** — отдельный блок, активен пока есть подключенный монитор

В P8 большинство блоков GPU **обесточены** (power-gated), активен только display
engine для вывода изображения. На 595 P8 с памятью 405 МГц достижим
при низком flip rate (~<140 atomic commits/sec). На 580+ GDDR6 остаётся на
7000 МГц независимо от условий.

## Типы контекстов (nvidia-smi pmon)

В колонке `C/G` отображаются типы контекстов процесса:

- `G` — Graphics (OpenGL, Vulkan graphics, EGL)
- `C` — Compute (CUDA, OpenCL, Vulkan compute)
- `C+G` — и то и другое

**Практический опыт (2026-06-22):** KWin 6.7.0 на Wayland открывает `C+G`.
Блокировка compute (`nvidia-smi -c 2`, PROHIBITED) убирает `C`, но не влияет
на P-state или мощность. C+G → G не снижает 44 Вт. Compute-контекст — артефакт
NVIDIA EGL, не влияющий на питание на десктопном Туринге.

## Clocks Event Reasons

Показывает, что именно удерживает GPU от понижения P-state:

```bash
nvidia-smi -q -d PERFORMANCE | grep -A10 "Clocks Event Reasons"
```

- `Idle` — Active: GPU считает что простаивает (но может быть в P0)
- `Display Clock Setting` — Active: дисплей блокирует понижение
- `Applications Clocks Setting` — Active: приложение запросило высокие частоты
- `SW Power Cap` — Active: ограничение мощности

**Опыт (GTX 1660 SUPER, Wayland, P0):**
- `Idle: Active` — GPU распознаёт простой
- `Display Clock Setting: Not Active` — дисплей НЕ запрашивает P0
- **GPU в P0 вопреки всем условиям** — проблема не в display, не в compute

## Почему GPU может застрять в P0 (GTX 1660 SUPER, 595.58.03)

Основные причины (проверено экспериментально):

1. **Wayland ≥144 Гц** — KWin генерирует ~120+ atomic commits/sec через nvidia-drm.
   GSP firmware держит P0 при высокой частоте atomic page flips.
2. **X11** — 0 atomic commits (Xorg через legacy nvidia-modeset) → P8 достижим.
3. **Драйвер 580 series** — P8 не достижим ни при каких условиях с дисплеем.
4. **GPU-ускоренные приложения** — браузеры, терминалы (Warp), Electron — добавляют
   свою нагрузку, но не являются первичной причиной (даже 0% GPU Util → P0 на 165 Гц).

## DPM (Dynamic Power Management)

Параметр ядра `NVreg_DynamicPowerManagement` управляет переключением частоты
памяти:

| Значение | Режим |
|---|---|
| 0x00 | DPM отключён |
| 0x01 | DPM принудительно включён |
| 0x02 | DPM только для ноутбуков |
| 0x03 | DPM авто (по умолчанию) |

Сопутствующий параметр:
```
NVreg_DynamicPowerManagementVideoMemoryThreshold=<MB>
```
Порог занятой VRAM, ниже которого DPM разрешает снижение частоты памяти.
По умолчанию: 200 MB. Если занято больше — DPM не активируется.

**Опыт (GTX 1660 SUPER, 580.159.04):** Ни один режим DPM + любой порог не
снизили частоту памяти при активном дисплее.

## nvidia-powerd

Демон Dynamic Power Management от NVIDIA. Запускается через systemd:
```bash
sudo systemctl enable --now nvidia-powerd.service
```

**Опыт:** На Туринге (TU116) завершается с кодом 1 — не поддерживается.
Работает только на Ada Lovelace (RTX 4000) и новее.

## Как проверить текущее P-state

```bash
nvidia-smi -q -d PERFORMANCE | grep "Performance State"
# Вывод: P0, P2, P8 и т.д.

nvidia-settings -q GPUPerfModes
# Покажет все доступные уровни с частотами

nvidia-smi -q -d CLOCK
# Текущие частоты ядра и памяти
```

## Dmesg-логирование P-state (debug build nvidia-open)

В коде `nvEvoIsModePossibleC3()` (`nvkms-evo3.c`) добавлен лог вызовов IMP
(Is Mode Possible) — механизма, которым драйвер дисплея запрашивает у GSP
минимальный P-state для текущего видеорежима:

```
IMP: requireBootClocks=0 reallocBW=0 options=0x0 ret=0 bIsPossible=1 minImpVPState=6
```

**Ключевое открытие** (22.06.2026): IMP возвращает **P6** для **2560x1440@165 Гц**
на Wayland. `requireBootClocks=0` — валидация на P8 не запрашивается.
Несмотря на это, GPU находится в **P0** (7000 MHz, 50 Вт).

Вывод: **IMP не является причиной P0.** Проблема не в display-валидации,
а глубже — в управлении P-State драйвером/GSP firmware (см. ниже).

## Архитектура управления P-State в nvidia-open (595.58.03)

### Ключевая архитектурная находка

**Open-source часть драйвера (kernel-mode RM / CPU RM) — это только
control-plane routing layer для управления P-State.**

Фактические переходы P-State и изменения частоты памяти выполняются
**физическим RM (PRM) firmware**, который работает на GSP (GPU System Processor)
и является **проприетарным бинарным кодом**, не входящим в open-source
релиз.

Open-source код:
1. Определяет контрольные интерфейсы (`NV2080_CTRL_CMD_PERF_*`) и
   константы P-State
2. Реализует kernel-mode сторону управления питанием (GC6 entry/exit,
   suspend/resume, динамическое управление)
3. **Направляет P-State запросы** в physical RM через RPC
   (`NV_RM_RPC_CONTROL`, `pRmApi->Control`)
4. Управляет системной координацией — ACPI callbacks, SBIOS platform
   request handler, vPstate negotiation, VRR P-State switching
5. Обрабатывает предусловия — проверяет что GPU в P8 перед GC6 entry,
   управляет принудительными perf levels во время переходов

### Полный список файлов, участвующих в P-State / питании

#### A. Core Performance (P-State) — kernel модуль

| # | Файл | Описание |
|---|---|---|
| 1 | `src/nvidia/src/kernel/gpu/perf/kern_perf.c` | Конструктор/деструктор perf engine, `kperfStateInit`, `kperfStateLoad`, `kperfStateUnload` |
| 2 | `src/nvidia/src/kernel/gpu/perf/kern_perf_pwr.c` | `kperfPerfSetPowerstate_KERNEL` — отправка `NV2080_CTRL_CMD_PERF_SET_POWERSTATE` в physical RM |
| 3 | `src/nvidia/src/kernel/gpu/perf/kern_perf_ctrl.c` | `subdeviceCtrlCmdPerfGetCurrentPstate_VF` — чтение текущего P-State через RPC к RM |
| 4 | `src/nvidia/src/kernel/gpu/perf/kern_perf_pm.c` | Perfmon клиент |
| 5 | `src/nvidia/src/kernel/gpu/perf/kern_perf_boost.c` | GPU Boost (P-State limiting) |
| 6 | `src/nvidia/src/kernel/gpu/perf/kern_perf_gpuboostsync.c` | Синхронизация Boost через SLI |
| 7 | `src/nvidia/src/kernel/gpu/perf/kern_perfbuffer.c` | Perf Boost Hint |
| 8 | `src/nvidia/src/kernel/gpu/perf/kern_cuda_limit.c` | CUDA safe limits |

#### B. Generated Kernel Perf (NVOC Virtual Dispatch)

| # | Файл | Описание |
|---|---|---|
| 9 | `generated/g_kern_perf_nvoc.h` | Виртуальная таблица функций kperfState* |
| 10 | `generated/g_kern_perf_nvoc.c` | NVOC up-thunk dispatch wrappers |

#### C. GPU Power Management (GC6 / Standby)

| # | Файл | Описание |
|---|---|---|
| 11 | `src/nvidia/src/kernel/gpu/kern_gpu_power.c` | **GC6 state machine**: `gpuGc6Entry_IMPL` (проверяет P8 перед power-off), `gpuGc6Exit_IMPL` |
| 12 | `src/nvidia/src/kernel/gpu/gpu_suspend.c` | **Suspend/resume**: `gpuPowerManagementEnter` → `gpuStateUnload` → `kperfStateUnload` |
| 13 | `src/nvidia/inc/kernel/gpu/kern_gpu_power.h` | `GPU_GC6_STATE` enum (POWERED_ON, ENTERING, ENTERED, EXITING) |

#### D. Platform Request Handler (SBIOS/ACPI vPstate Control)

| # | Файл | Описание |
|---|---|---|
| 14 | `src/nvidia/src/kernel/platform/platform_request_handler.c` | `pfmreqhndlrPcontrol_IMPL` — обработка `REQ_VPSTATE_SET` от SBIOS |
| 15 | `src/nvidia/src/kernel/platform/platform_request_handler_ctrl.c` | Обработка команд SBIOS, карта сенсоров, vPstate mapping |

#### E. Unix/Linux Dynamic Power Management

| # | Файл | Описание |
|---|---|---|
| 16 | `arch/nvalloc/unix/src/dynamic-power.c` | Состояние D3/GC6: `nv_dynamic_power_state_transition`, `RmCheckForGcxSupportOnCurrentState` |
| 17 | `arch/nvalloc/unix/src/power-management-tegra.c` | Tegra-specific power management |

#### F. PMU (Power Management Unit)

| # | Файл | Описание |
|---|---|---|
| 18 | `src/nvidia/src/kernel/gpu/pmu/kern_pmu.c` | PMU engine (конструктор, деструктор, управление памятью) |
| 19 | `src/nvidia/inc/kernel/gpu/pmu/kern_pmu.h` | PMU interface |

#### G. Control Headers — P-State Constants and Commands

| # | Файл | Описание |
|---|---|---|
| 20 | `common/sdk/nvidia/inc/ctrl/ctrl2080/ctrl2080perf.h` | **Главный файл**: P0-P15 definitions, `PERF_GET_CURRENT_PSTATE`, `PERF_AGGRESSIVE_PSTATE_NOTIFY`, `PERF_SET_POWERSTATE`, vPstate |
| 21 | `common/sdk/nvidia/inc/ctrl/ctrl2080/ctrl2080power.h` | GC6 entry/exit commands |
| 22 | `common/sdk/nvidia/inc/ctrl/ctrl2080/ctrl2080clk.h` | Clock domain IDs |
| 23 | `common/sdk/nvidia/inc/ctrl/ctrl2080/ctrl2080internal.h` | Internal RPC: `SET_VPSTATE`, `GET_VPSTATE_INFO` |
| 24 | `common/sdk/nvidia/inc/ctrl/ctrl2080/ctrl2080perf_cf.h` | Curve fit data |
| 25 | `common/sdk/nvidia/inc/ctrl/ctrl2080/ctrl2080perf_cf_pwr_model.h` | Power model for curve fit |

#### H. HWPM Power Module

| # | Файл | Описание |
|---|---|---|
| 26-28 | `generated/g_kern_hwpm_power_nvoc.*` | Hardware PM power (generated) |

#### I. Memory Clock / VRR P-State Switch (Display/Modeset)

| # | Файл | Описание |
|---|---|---|
| 29 | `nvidia-modeset/src/nvkms-vrr.c` | `ConfigVrrPstateSwitch` — VRR P-state switch через `NV0073_CTRL_CMD_SYSTEM_CONFIG_VRR_PSTATE_SWITCH` |
| 30 | `nvidia-modeset/os-interface/include/nvidia-modeset-os-interface.h` | `nvkms_disable_vrr_memclk_switch()` — OS-interface hook |
| 31 | `generated/g_disp_objs_nvoc.h` | `dispcmnCtrlCmdSystemConfigVrrPstateSwitch_IMPL` |

#### J. Другие важные файлы

| # | Файл | Описание |
|---|---|---|
| 32 | `arch/nvalloc/unix/include/nv.h` | `NV_POWER_STATE_IN_HIBERNATE`, `NV_POWER_STATE_RUNNING` |
| 33 | `arch/nvalloc/unix/src/osapi.c` | ACPI power source → `PERF_SET_POWERSTATE`, `PERF_SET_AUX_POWER_STATE` |
| 34 | `common/sdk/nvidia/inc/ctrl/ctrl5070/ctrl5070chnc.h` | Perf level info + pstate в контексте IMP |
| 35 | `common/sdk/nvidia/inc/ctrl/ctrlc372/ctrlc372chnc.h` | Channel commands — IMP/pstate/min v-pstate |
| 36 | `common/sdk/nvidia/inc/class/cl00de.h` | `currentPstate` field (device 0x00DE) |
| 37 | `common/sdk/nvidia/inc/class/cl2080_notification.h` | `AUX_POWER_STATE_CHANGE`, `POWER_EVENT` |
| 38 | `common/sdk/nvidia/inc/ctrl/ctrl2080/ctrl2080bus.h` | PCIE link width P-state |
| 39 | `common/sdk/nvidia/inc/ctrl/ctrl2080/ctrl2080nvlink.h` | NVLink pstate switch |

### Три самых важных файла для понимания P-State транзиций

#### 1. `ctrl2080perf.h` — контракт P-State интерфейса

Определяет всё:
- P0-P15 как bitmask constants (строки 849-871)
- `NV2080_CTRL_CMD_PERF_GET_CURRENT_PSTATE` (строка 889)
- `NV2080_CTRL_CMD_PERF_AGGRESSIVE_PSTATE_NOTIFY` (строка 640) — команда "GPU простаивает, можно снижать"
- `NV2080_CTRL_CMD_PERF_GPU_IS_IDLE` (строка 608) — возвращает prevPstate
- `NV2080_CTRL_CMD_PERF_SET_POWERSTATE` (строка 162) — AC/DC switching
- `NV2080_CTRL_CMD_PERF_SET_AUX_POWER_STATE` (строка 185) — AUX P0-P4
- vPstate structures (строки 295-649)
- `NV2080_CTRL_PERF_GET_LEVEL_INFO` — frequencies per clock domain (строки 652-696)

#### 2. `kern_gpu_power.c` — GC6 state machine

- `gpuGc6Entry_IMPL` (строка 132): последовательность входа в GC6, **проверяет
  что GPU в P8** (строка 164, `gpuGc6EntryPstateCheck`) перед power-off
- `gpuGc6Exit_IMPL` (строка 65): выход из GC6 → `gpuResumeFromStandby`
- `gpuPowerOff_KERNEL` / `gpuPowerOn_KERNEL` (строки 245, 279): физическое
  включение/выключение GPU через SBIOS/ACPI

#### 3. `gpu_suspend.c` — полный цикл suspend/resume

- `gpuEnterStandby_IMPL` (строка 509): вход в GC6 → `gpuPowerManagementEnter`
- `gpuResumeFromStandby_IMPL` (строка 554): выход из GC6 → `gpuPowerManagementResume`
- `gpuPowerManagementEnter` (строка 71): state unload для всех engine,
  включая perf → `kperfStateUnload`
- `gpuPowerManagementResume` (строка 153): state load → `kperfStateLoad` →
  platform request handler init → vPstate restore

### Функции, которые напрямую меняют P-State

| Функция | Файл | Описание |
|---|---|---|
| `gpuGc6EntryPstateCheck` | `g_gpu_nvoc.h:5259` | Проверяет что GPU в P8 перед GC6 entry |
| `_gpuGc6EntryStateUnload` | `kern_gpu_power.c:500` | Устанавливает `FORCE_PERF_BIOS_LEVEL` и принудительно P8 |
| `gpuPowerManagementEnter` | `gpu_suspend.c:71` | Выгружает все engine, включая perf |
| `kperfPerfSetPowerstate_KERNEL` | `kern_perf_pwr.c:207` | Отправляет `NV2080_CTRL_CMD_PERF_SET_POWERSTATE` в physical RM |
| `subdeviceCtrlCmdPerfSetAuxPowerState_KERNEL` | `kern_perf_pwr.c:169` | Отправляет `NV2080_CTRL_CMD_PERF_SET_AUX_POWER_STATE` в physical RM |
| `subdeviceCtrlCmdPerfGetCurrentPstate_VF` | `kern_perf_ctrl.c:330` | Читает текущий P-State RPC-запросом к physical RM |
| `pfmreqhndlrPcontrol_IMPL` | `platform_request_handler.c:188` | Обрабатывает `REQ_VPSTATE_SET` от SBIOS, вызывает `SET_VPSTATE` |
| `ConfigVrrPstateSwitch` | `nvkms-vrr.c:626` | VRR P-state switch (display engine) |
| `nv_dynamic_power_state_transition` | `dynamic-power.c:248` | Переключение D3-состояний (IN_USE → IDLE → INDICATED) |
| `subdeviceCtrlCmdInternalPerfPfmReqHndlrSetVpstate_IMPL` | `generated/g_subdevice_nvoc.h:5607` | Установка vPstate в physical RM |

### Функции, влияющие на частоту памяти

Open-source код не содержит прямого управления частотой памяти (memclk).
Управление частотой памяти — внутри **проприетарного physical RM firmware** на GSP.

| Функция | Файл | Описание |
|---|---|---|
| `nvkms_disable_vrr_memclk_switch()` | `os-interface/nvidia-modeset-os-interface.h:117` | Отключение VRR memory clock switching |
| `ConfigVrrPstateSwitch` | `nvkms-vrr.c:626` | VRR P-state switch (влияет на тайминги памяти) |
| `NV2080_CTRL_PERF_GET_CLK_INFO` | `ctrl2080perf.h:652` | Структура с `currentFreq`, `minFreq`, `maxFreq` для clock domain |
| `NV2080_CTRL_CLK_DOMAIN_TEGRA_NVDCLK` | `ctrl2080clk.h:41` | Memory controller clock domain (только Tegra) |

## Анализ вызовов P-State команд в исходниках (nvidia-open 595.58.03)

### 1. `NV2080_CTRL_CMD_PERF_AGGRESSIVE_PSTATE_NOTIFY` — МЁРТВЫЙ КОД

Команда "GPU простаивает, можно снижать P-state".
Определена в `ctrl2080perf.h:640` — `#define NV2080_CTRL_CMD_PERF_AGGRESSIVE_PSTATE_NOTIFY (0x2080208f)`.
Параметры: `bGpuIsIdle`, `bRestoreToMax`, `idleTimeUs`, `busyTimeUs`.

**Статус: DEAD CODE.** Ноль использований `0x2080208f`, `bGpuIsIdle` или
`bRestoreToMax` в `src/nvidia/` и `src/nvidia-modeset/`. Команда определена
в RMAPI, но не подключена в этом релизе.

### 2. `NV2080_CTRL_CMD_PERF_GPU_IS_IDLE` — МЁРТВЫЙ КОД

Определена в `ctrl2080perf.h:608` — `NV2080_CTRL_CMD_PERF_GPU_IS_IDLE (0x20802089)`.
Возвращает `prevPstate` (P8/P5, etc).

**Статус: DEAD CODE.** Никто не вызывает.

Вывод: GSP firmware **сам решает** когда снижать P-State, без внешних команд
от драйвера. Ни на X11, ни на Wayland эти команды не шлются.

### 3. `NV2080_CTRL_CMD_PERF_SET_POWERSTATE` — только nvidia (core)

Живой вызов, но **только из `src/nvidia/`**, никогда из `src/nvidia-modeset/`:

| Файл | Функция | Контекст |
|---|---|---|
| `client_resource.c:1277-1327` | `cliresCtrlCmdSystemNotifyEvent_IMPL` | ACPI `POWER_SOURCE` (AC/DC) |
| `kern_perf_pwr.c:207-260` | `kperfPerfSetPowerstate_KERNEL` | Реализация: проверяет `gpuIsGpuFullPower()`, шлёт `SET_POWERSTATE` в GSP |
| `kern_perf_pwr.c:264-276` | `subdeviceCtrlCmdPerfSetPowerstate_IMPL` | Диспетчер |
| `osapi.c:1234-1249` | `RmPowerSourceChangeEvent` | Платформенный ACPI handler |

**`src/nvidia-modeset/` — ноль вызовов `NV2080_CTRL_CMD_PERF_*`.**
У дисплейной подсистемы нет связи с GPU P-State в open-source.

### 4. Единственный P-State вызов из nvidia-modeset: VRR

`ConfigVrrPstateSwitch()` (`nvkms-vrr.c:626-669`) — отправляет
`NV0073_CTRL_CMD_SYSTEM_CONFIG_VRR_PSTATE_SWITCH (0x730134)`.
Это DISPLAY-LEVEL команда (0x7301xx), НЕ GPU perf (0x2080xx).
Реализация в GSP firmware, не open-source.

Вызывается при VRR on/off и stall/lock.

### 5. IMP: `minImpVPState` возвращается, но НЕ потребляется

В IMP-структуре `NVC372_CTRL_IS_MODE_POSSIBLE_PARAMS` (`ctrlc372chnc.h:680-709`)
есть поля `minImpVPState` (строка 693) и `minPState` (строка 695).

В коде `nvEvoIsModePossibleC3:3310` и `nvEvoIsModePossibleC4:2415` —
**TODO-комментарий от NVIDIA:**
```c
// XXXnvdisplay TODO: check pImp->minImpVPState
```
Знают что надо использовать, но пока не сделали.

### 6. PostFlip IMP — понижение usage bounds через 10с

| Функция | Файл | Суть |
|---|---|---|
| `TryToDoPostFlipIMP()` | `nvkms-hw-flip.c:2744` | Таймер через 10с после флипа, понижает usage bounds |
| `SchedulePostFlipIMPTimer()` | `nvkms-hw-flip.c:2777` | Планирование таймера |
| `TryLoweringUsageBoundsOneHead()` | `nvkms-hw-flip.c:2650` | Проверяет idle каналов, понижает bounds |
| `nvRmApiControl()` | `nvkms-rmapi-dgpu.c:81` | Единый RM API путь из modeset |

### 7. Перспективные точки для патча

#### В `src/nvidia-modeset/` (display side):

| # | Файл | Строка | Функция | Суть |
|---|---|---|---|---|
| 1 | `nvkms-hw-flip.c` | 2949-2994 | `nvPostFlip()` | **Лучшая точка.** Вызывается после КАЖДОГО page flip. Идеально добавить `AGGRESSIVE_PSTATE` |
| 2 | `nvkms-hw-flip.c` | 2744-2774 | `TryToDoPostFlipIMP()` | Таймер 10с, уже понижает usage bounds |
| 3 | `nvkms-hw-flip.c` | 2650-2707 | `TryLoweringUsageBoundsOneHead()` | Уже проверяет idle каналов |
| 4 | `nvkms-evo.c` | 508 | `nvDoIMPUpdateEvo()` | Коммитит IMP update |
| 5 | `nvkms-vrr.c` | 626-669 | `ConfigVrrPstateSwitch()` | Уже показывает паттерн RM-команды из modeset |
| 6 | `nvkms-evo3.c` | 3291-3329 | `nvEvoIsModePossibleC3()` | Возвращает `minImpVPState`, не потребляет |
| 7 | `nvkms-modeset.c` | 1375-1464 | `ValidateProposedModeSetHwStateOneDispImp()` | Modeset-time IMP |

#### В `src/nvidia/` (kernel core side):

| # | Файл | Строка | Функция | Суть |
|---|---|---|---|---|
| 8 | `kern_perf_pwr.c` | 207-260 | `kperfPerfSetPowerstate_KERNEL()` | Можно добавить вызов `AGGRESSIVE_PSTATE` |
| 9 | `client_resource.c` | 1277-1327 | `cliresCtrlCmdSystemNotifyEvent_IMPL` | ACPI POWER_SOURCE handler |
| 10 | `kern_perf_ctrl.c` | 319 | `subdeviceCtrlCmdPerfGetCurrentPstate_KERNEL` | Чтение P-State |
| 11 | `kern_perf_pwr.c` | 168-204 | `subdeviceCtrlCmdPerfSetAuxPowerState_KERNEL()` | AUX power state |

### Ключевые выводы

1. **`AGGRESSIVE_PSTATE_NOTIFY` и `GPU_IS_IDLE` — dead code в open-source + GSP firmware.**
   Команды определены в RMAPI, но GSP firmware возвращает `NV_ERR_NOT_SUPPORTED (86)`.
   Даже если отправить их из драйвера — GSP их игнорирует.
2. **`SET_POWERSTATE` вызывается только при смене AC/DC.** Не про idle.
3. **nvidia-modeset не вызывает ни одной `NV2080_CTRL_CMD_PERF_*` команды.**
   Единственный вызов — VRR display-level (0x730134).
4. **IMP возвращает `minImpVPState`, но значение НЕ потребляется.**
   NVIDIA оставила TODO в коде.
5. **Все `NV2080_CTRL_CMD_PERF_*` команды из open-source кода `ret=86` (NV_ERR_NOT_SUPPORTED)**
   при отправке через GSP RPC из nvidia-modeset. GSP firmware их не реализует.

## Хронология экспериментов (22.06.2026)

### После настройки debug build nvidia-open на 595.58.03

1. Установлен debug `nvidia-modeset.ko` с логом IMP-запросов в `nvEvoIsModePossibleC3()`
2. Результат на Wayland (2560x1440@165):
   ```
   IMP: requireBootClocks=0 reallocBW=0 options=0x0 ret=0 bIsPossible=1 minImpVPState=6
   ```
   - **~100 вызовов IMP при загрузке SDDM + KDE**
   - Все с одинаковыми параметрами
   - **minImpVPState=6** — P6 достаточно даже для 2K@165
   - `requireBootClocks=0` — GSP **не запрашивает валидацию на P8**
   - GPU при этом в **P0** (7000 MHz, 50 Вт)

3. Clocks Event Reasons:
   - `Idle: Active` — GPU распознаёт простой
   - `Display Clock Setting: Not Active` — дисплей не блокирует понижение

### Попытка 1: AGGRESSIVE_PSTATE_NOTIFY (22.06.2026)

Добавлен вызов `NV2080_CTRL_CMD_PERF_AGGRESSIVE_PSTATE_NOTIFY(bGpuIsIdle=true)`
в `nvPostFlip()` (nvkms-hw-flip.c) с rate limit каждые 330 флипов (~2 сек).
Также добавлено логирование возврата.

**Результат:**
```
dmesg: AGGRESSIVE_PSTATE: ret=86 idle=1 restore=0
```

**`ret=86` = `NV_ERR_NOT_SUPPORTED`.** GSP firmware не обрабатывает эту команду.

### Попытка 2: GPU_IS_IDLE (22.06.2026)

Добавлен `NV2080_CTRL_CMD_PERF_GPU_IS_IDLE` в тот же `nvPostFlip()` с rate limit
каждые 165 флипов (~1 сек). Логируется `prevPstate` и `action`.

**Результат:**
```
dmesg: GPU_IS_IDLE: ret=86 prevPstate=0 action=0x0
```

**Тот же `ret=86`.** GSP firmware не реализует ни одну `NV2080_CTRL_CMD_PERF_*`
команду из open-source RMAPI.

### Verdict v2 (после 2 экспериментов с GSP RPC)

**Все `NV2080_CTRL_CMD_PERF_*` команды = мертвый код даже для GSP firmware.**
Open-source RMAPI определяет интерфейс, но бинарный GSP firmware:
- Собран из другого (закрытого) дерева исходников
- Не содержит реализации этих команд (или они удалены)
- Управляет P-State полностью автономно, без внешних подсказок

P-State управления из `nvidia-modeset` через стандартные RM API **невозможно**.
Нужен другой подход.

### Следующие шаги (пересмотренные, 22.06.2026)

1. ✅ `AGGRESSIVE_PSTATE_NOTIFY` — ret=86 (GSP не реализует)
2. ✅ `GPU_IS_IDLE` — ret=86 (GSP не реализует)
3. ✅ `SET_POWERSTATE(battery)` — ret=0, ignored
4. ✅ Registry-ключи PowerMizer — без эффекта
5. ✅ GSP firmware OFF — P0 остался
6. ✅ 60/120 Гц → P8 (подтверждает flip-rate гипотезу)
7. ✅ bpftrace: ~100-120 atomic commits/sec на Wayland
8. ⬜ `KWIN_DRM_NO_AMS=1` — проверить legacy page flip path
9. ⬜ GSP firmware логи (`NVreg_EnableGpuFirmwareLogs=1`) — сравнить X11 vs Wayland

## Ссылки

- [NVIDIA Driver 595 — P-state changes (Treeru)](https://treeru.com/en/blog/nvidia-driver-595-blackwell-upgrade)
- [NVIDIA nvidia-smi documentation](https://developer.nvidia.com/nvidia-system-management-interface)
