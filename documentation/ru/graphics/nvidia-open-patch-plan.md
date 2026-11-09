# План: патч nvidia-open для фикса P0 на Wayland

**Статус: ИССЛЕДОВАНИЕ ПРОДОЛЖАЕТСЯ.**

Найдена корреляция: flip rate ↔ P-state (165 Гц → P0, 60 Гц → P8).
Но это регрессия — раньше работало при 165 Гц. Нужно понять, что
изменилось.

**Текущие данные:**
- Wayland 165 Гц → P0, 7000 MHz, ~44W
- Wayland 60 Гц → P8, 405 MHz, ~21W
- X11 165 Гц → P8, 405 MHz, ~21W
- RMAPI команды управления P-state не работают (ret=86 или ignored)

**Гипотезы регрессии:**
1. GSP firmware изменил порог flip rate (между 580 и 595)
2. KWin 6.7.0 изменил atomic commit паттерн
3. DRM слой изменил обработку flips

**Цель:** заставить GTX 1660 Super (TU116) переходить в P8 в простое
на NVIDIA 595 + **Wayland** (KWin) при 165 Гц.

## Выводы по nvidia-open

**Патчить nvidia-open бесполезно.** Все RMAPI команды управления P-state —
dead code. GSP firmware (бинарный blob) автономно управляет P-state на
основе эвристик (вероятно, частота atomic page flip событий).

**Новое направление: исследование KWin DRM backend.**

Собран KWin 6.7.0 с debug логом (`fprintf` в `DrmAtomicCommit::commit()`).
Найдено:
- `bpftrace` показал ~100 atomic commits/sec на 60 Гц и ~120/sec на 165 Гц
- KWin НЕ делает atomic commit каждый vsync (нелинейная зависимость)
- Разница между P8 и P0 — всего ~20 commits/sec

Гипотеза: GSP firmware считает atomic page flip события через nvidia-drm.
На X11 atomic commits = 0 (Xorg использует legacy nvidia-modeset) → P8.
На Wayland ~120 atomic commits/sec на 165 Гц → P0.

## Исследование исходников (22.06.2026)

Клонирован nvidia-open-src (тэг 595.58.03) в `nvidia-open-src/`.

### Архитектура управления P-State

**Open-source часть драйвера — только control-plane routing layer.**
Фактические переходы P-State и изменения частоты памяти выполняются
**физическим RM (PRM) firmware** на GSP (GPU System Processor) —
проприетарный бинарный код, не входящий в open-source релиз.

Подробная карта всех файлов: `nvidia-p-states.md`

### Результаты debug build (22.06.2026)

Добавлен `nvEvoLog` в `nvEvoIsModePossibleC3()` (nvkms-evo3.c).
Собран и установлен debug `nvidia-modeset.ko`. Результат на Wayland:

```
dmesg: IMP: requireBootClocks=0 reallocBW=0 options=0x0
       ret=0 bIsPossible=1 minImpVPState=6
```

**Ключевое открытие:**
- `requireBootClocks=0` — GSP не запрашивает валидацию на P8
- `minImpVPState=6` — P6 достаточно для 1920x1080@60
- GPU при этом в **P0** (7000 MHz, 50 Вт) — вопреки IMP

Clocks Event Reasons: `Idle: Active`, `Display Clock Setting: Not Active`.
GPU распознаёт простой, дисплей не блокирует понижение, но P-State не падает.

### Вывод v1 (до экспериментов с GSP RPC)

**Проблема НЕ в IMP (display mode validation).** IMP возвращает P6,
что должно допускать P6-P8. Причина P0 — в управлении P-State
драйвером/GSP firmware, не связанном с дисплеем.

### Вывод v2 (после 2 экспериментов с GSP RPC)

**Все `NV2080_CTRL_CMD_PERF_*` команды = мертвый код даже для GSP firmware.**
Open-source RMAPI определяет интерфейс, но бинарный GSP firmware:
- Собран из другого (закрытого) дерева исходников
- Не содержит реализации этих команд (или они удалены)
- Управляет P-State полностью автономно

P-State управления из `nvidia-modeset` через стандартные RM API **невозможно**.

## Стратегия

### Что провалилось

| Команда | Результат | Причина |
|---------|-----------|---------|
| `AGGRESSIVE_PSTATE_NOTIFY` | `ret=86` (NV_ERR_NOT_SUPPORTED) | GSP не реализует |
| `GPU_IS_IDLE` | `ret=86` (NV_ERR_NOT_SUPPORTED) | GSP не реализует |

### Что убрано из плана

- **`requireBootClocks=true`** — не влияет на runtime P-state, только на
  IMP-валидацию.
- **`AGGRESSIVE_PSTATE` / `GPU_IS_IDLE` из nvPostFlip** — GSP их не обрабатывает.
- **Все прямые RM API команды** — GSP firmware их не реализует.

## Выводы

**Патчить nvidia-open для P-state бесполезно** — все RMAPI команды мёртвы,
GSP firmware автономен. Дальнейшее расследование — KWin DRM backend
и GSP firmware логи.

### Что сделано
| Шаг | Результат |
|-----|-----------|
| IMP-лог в nvkms-evo3.c | IMP не виноват (minImpVPState=6) |
| AGGRESSIVE_PSTATE_NOTIFY | ret=86 |
| GPU_IS_IDLE | ret=86 |
| SET_POWERSTATE(battery) | ret=0, ignored |
| Registry-ключи PowerMizer | без эффекта |
| GSP firmware off | без эффекта |
| bpftrace: atomic commits | ~100-120/sec на Wayland |

### Что дальше
1. `KWIN_DRM_NO_AMS=1` — legacy page flip path
2. GSP firmware логи — сравнить X11 vs Wayland
3. Сравнить KWin 6.6 vs 6.7 DRM backend

#### Шаг 1. ✅ Проверить IMP

Добавлен лог, собран модуль, получены данные.
IMP не виноват. Подтверждено.

#### Шаг 2. ❌ `AGGRESSIVE_PSTATE_NOTIFY` — не работает

`ret=86` — GSP firmware не реализует.

#### Шаг 3. ❌ `GPU_IS_IDLE` — не работает

`ret=86` — GSP firmware не реализует.

#### Шаг 4. ✅ `SET_POWERSTATE` (battery) — ret=0, но без эффекта

GSP принимает команду, но игнорирует.

#### Шаг 5. ✅ Registry-ключи — не помогли

PowerMizer registry не влияет на P-state.

#### Шаг 6. ✅ GSP firmware off — не помог

`EnableGpuFirmware=0` — P0 остался. GSP не причина.

#### Шаг 7. ✅ bpftrace — подсчёт atomic commits

`bpftrace` на `DRM_IOCTL_MODE_ATOMIC` (=0xC03864BC):

| Режим | Commits/sec | P-state |
|-------|-----------:|:-------:|
| 60 Гц | ~100 | P8 |
| 120 Гц | ~121-162 | P8 |
| 165 Гц | ~114-122 | P0 |

KWin НЕ делает commit каждый vsync. Порог P0 ≈ 120+ commits/sec.

### Новое направление: KWin DRM backend

RMAPI-патчинг мёртв. GSP firmware считает atomic page flips.
Нужно:
1. `KWIN_DRM_NO_AMS=1` — legacy path, проверить меняет ли P-state
2. Посчитать DRM ioctls на X11 (должен быть 0 atomic)
3. GSP firmware логи — сравнить X11 vs Wayland

### Риски

- Проблема может быть в GSP firmware — не поддаётся патчу вообще
- Или в user-space EGL — тоже не патчится
- Registry-ключи могут не иметь эффекта на открытом драйвере
- После обновления dnf патч слетит

---

**Связанные файлы:**
- `nvidia-power-debug.md` — полное расследование (10 экспериментов)
- `nvidia-p-states.md` — архитектура P-State, карта исходников, IMP-лог
- `nvidia-open-src/` — исходники с debug патчем
