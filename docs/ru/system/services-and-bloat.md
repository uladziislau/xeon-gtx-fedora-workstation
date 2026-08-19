# 🧹 Аудит служб и «раздутости»

> Убираем то, что физической рабочей станции не нужно; держим ОС лёгкой и понятной.
> Соответствует цели проекта: **устранять лишнее, всегда с задокументированным откатом.**

## Результат (применено)

Удалено **9 пакетов**, обслуживающих виртуализацию / серверные / мобильные сценарии, тогда как эта машина — **физический десктоп** (`systemd-detect-virt` = `none`).

| Пакет | Служба(ы) | Почему удалён |
|-------|-----------|---------------|
| `qemu-guest-agent` | `qemu-guest-agent` | гостевое агентство для QEMU/KVM — нет VM |
| `open-vm-tools` | `vmtoolsd`, `vgauthd` | гостевое ПО VMware — нет VMware |
| `iscsi-initiator-utils` | `iscsi-onboot`, `iscsi-starter` | сетевой boot по iSCSI — только локальные NVMe/SATA |
| `livesys-scripts` | `livesys`, `livesys-late` | инициализация live-носителей (USB) — обычная установка |
| `ModemManager` | `ModemManager` | управление 3G/4G-модемами — их нет |
| `pcsc-lite` | `pcscd`, `pcscd.socket` | демон смарт-карт/токенов — не используется |
| `at` | `atd` | разовые задачи по расписанию (`at`) — не используется |
| `gssproxy` | `gssproxy` | прокси GSSAPI/Kerberos — нет корпоративного домена |
| `numad` | `numad` | демон NUMA-локальности — ядро справляется на рабочей станции |

### Отключены (службы выключены), пакеты оставлены — нужны KDE
Эти два демона — **жёсткие зависимости Plasma**, поэтому пакеты остаются, но службы выключены:

| Служба | Пакет | Почему оставлен |
|--------|-------|-----------------|
| `accounts-daemon` | `accountsservice` | тянет `plasma-desktop` (профили/UI) |
| `avahi-daemon` (+`avahi-daemon.socket`) | `avahi` | тянется через `nss-mdns → kf6-kdnssd → kio-extras → plasma-workspace` |

Обе теперь `disabled` + `inactive`. Если функциям Plasma они вдруг понадобятся:
`systemctl enable --now accounts-daemon avahi-daemon`.

---

## 2026-08-19: Анализ краша и очистка сломанных служб

### «Краш» в 12:19:15 — что на самом деле произошло
Никакого kernel panic / hard reset. Система работала с 10:31. В ~12:18–12:19 **шторм рестартов** от трёх сломанных user/system служб забил журнал и съел CPU/IO:

| Служба | Тип | Причина | Действие |
|--------|-----|---------|----------|
| `agy-zen-proxy.service` | user | `Cannot find module '/home/uladzislau/Projects/agy-zen/dist/proxy.js'` — проекта нет | **Отключена, замаскирована, unit-файл удалён** |
| `mouse-chord.service` | user | `ExecStart` указывал на `/home/uladzislau/Projects/agentica/tools/scripts/mouse-chord-daemon.py` — проект переименован в `synchronika` | **Починено**: путь обновлён на `/home/uladzislau/Projects/ai/synchronika/sync/scripts/mouse-chord-daemon.py`, **включена и работает** |
| `upscale-cam.service` | system | Symlink `/usr/local/bin/upscale-cam` → `/home/uladzislau/Projects/agentica/sync/devices/xeon/video/upscale-cam.sh` — цели нет | **Symlink поправлен** на `/home/uladzislau/Projects/ai/synchronika/sync/devices/xeon/video/upscale-cam.sh`, служба **оставлена отключённой** (идея сохранена) |

Шторм рестартов (счётчики > 1970) прекратился сразу после исправлений. Никакого повторного «краша» не было; следующая перезагрузка (12:43) была ручной.

### Результат
- `mouse-chord` ✅ работает (Right+Wheel → Tab switching, uinput устройство создано)
- `agy-zen-proxy` ❌ удалён (нет проекта)
- `upscale-cam` ⏸ отключён, symlink верный, скрипт на месте в `synchronika`

---

## 2026-08-19 (продолжение): Дополнительные исправления служб

### Повреждение конфига v4l2loopback
**Проблема:** Пароль `41144` случайно записался в `/etc/modules-load.d/v4l2loopback.conf` и `/etc/modprobe.d/v4l2loopback.conf`, вызывая ошибки `systemd-modules-load` при загрузке.

**Исправление:** Восстановлены корректные конфиги:
```bash
# /etc/modules-load.d/v4l2loopback.conf
v4l2loopback

# /etc/modprobe.d/v4l2loopback.conf
options v4l2loopback devices=1 video_nr=10 card_label="Upscaled Cam" exclusive_caps=1
```

### Синтаксическая ошибка в bluetooth-ht300-connect.service
**Проблема:** Скрипт `/usr/local/bin/connect_ht300.sh` имел некорректный `if` (нет `then`, `fi` на одной строке).

**Исправление:** Скрипт переписан с правильным синтаксисом. Служба запускается и подключается успешно.

### Сломанный путь в windscribe-watch.service
**Проблема:** `ExecStart` указывал на `/home/uladzislau/Projects/agentica/tools/scripts/windscribe-manager.sh` — проект переименован в `synchronika`.

**Исправление:** Путь обновлён на `/home/uladzislau/Projects/ai/synchronika/sync/scripts/windscribe-manager.sh`, переменная `AGENTICA_DIR` поправлена. Служба работает.

### firewalld зона docker-forwarding
**Проблема:** Остаточная зона firewalld от удалённого Docker вызывала `ERROR: NAME_CONFLICT` и `ERROR: INVALID_ZONE`.

**Исправление:** `firewall-cmd --permanent --delete-zone=docker-forwarding && firewall-cmd --reload`. Зона удалена.

---

## Как откатить

Бэкапы лежат в [`scripts/backup/`](../../scripts/backup/):
- `services-enabled-before.list` — снимок включённых юнитов до изменений.
- `packages-before.list` — полный список установленных пакетов до изменений.

Вернуть удалённые пакеты:
```bash
sudo dnf install -y qemu-guest-agent open-vm-tools iscsi-initiator-utils livesys-scripts ModemManager pcsc-lite at gssproxy numad
sudo systemctl enable --now accounts-daemon avahi-daemon
```

Восстановить сломанные службы (при необходимости):
```bash
# agy-zen-proxy — только если проект появится снова
# mouse-chord — уже починен, просто включить:
systemctl --user enable --now mouse-chord.service

# upscale-cam — включить когда будет нужно:
sudo systemctl enable --now upscale-cam.service
```

---

## Что проверено
- `dnf check` → реальных разрывов зависимостей нет (только дубликаты версий, существовавшие ранее).
- У удалённых пакетов **нет установленных обратных зависимостей**.
- `sddm` активен; сессия KDE не пострадала.
- Журнал чист: нет циклов рестартов, нет ошибок MODULE_NOT_FOUND.