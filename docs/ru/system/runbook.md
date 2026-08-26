# 🛠️ Runbook: Системный аудит Fedora Workstation (Xeon + GTX)

> **Цель:** Пошаговый аудит и оптимизация системы — от фундамента к стратегии.
> **Принцип:** Каждое действие = команда проверки + команда применения + команда отката.
> **Философия:** «Убираем лишнее, оставляем понятное, документируем всё».

---

## 📋 Обзор фаз

| Фаза | Фокус | Оценка усилий | Ожидаемый эффект |
|------|-------|---------------|------------------|
| **1. Фундамент** | Boot, Сервисы, Пакеты | ~2-3 часа | Чистая база, удалены лишние пакеты/сервисы |
| **2. Оптимизация** | GPU, Memory/CPU | ~2-3 часа | Производительность, термика, отзывчивость |
| **3. Trim** | KDE, Security | ~1-2 часа | Минимум лишнего, базовая защита |
| **4. Стратегия** | Решение про declarative | ~30 мин | Чёткий вектор развития |

---

## 🏗️ ФАЗА 1: ФУНДАМЕНТ (Boot + Services + Packages)

### 1.1 Boot/GRUB/initrd аудит

#### 🔍 Проверка (read-only)
```bash
# Текущие GRUB параметры
cat /etc/default/grub | grep GRUB_CMDLINE_LINUX

# Загруженные модули initrd
lsinitrd | grep -E "nvidia|v4l2|i2c" | head -20

# Размер initrd
ls -lh /boot/initramfs-$(uname -r).img

# systemd-analyze
systemd-analyze time
systemd-analyze blame | head -20
systemd-analyze critical-chain
```

#### ⚙️ Оптимизация (применение)
```bash
# Бэкап
sudo cp /etc/default/grub /etc/default/grub.bak.$(date +%F)

# GRUB_CMDLINE_LINUX — добавить/проверить:
# mitigations=off (уже есть)
# transparent_hugepage=always (уже есть)
# zswap.max_pool_percent=100 (уже есть)
# nvidia-drm.modeset=1 (для Wayland)
# initrd только нужные модули (dracut omit)

# Dracut — исключить ненужные драйверы
sudo tee /etc/dracut.conf.d/99-omit.conf > /dev/null << 'EOF'
omit_drivers+=" i2c-i801 i2c-smbus i2c-piix4 floppy parallel "
omit_drivers+=" pcspkr joydev "
hostonly=yes
hostonly_cmdline=yes
EOF

# Пересобрать initrd
sudo dracut -f /boot/initramfs-$(uname -r).img $(uname -r)
sudo grub2-mkconfig -o /boot/grub2/grub.cfg
```

#### ↩️ Откат
```bash
sudo cp /etc/default/grub.bak.$(date +%F) /etc/default/grub
sudo rm /etc/dracut.conf.d/99-omit.conf
sudo dracut -f /boot/initramfs-$(uname -r).img $(uname -r)
sudo grub2-mkconfig -o /boot/grub2/grub.cfg
```

#### ✅ Чек-лист
- [ ] `systemd-analyze time` — kernel + userspace < 5с
- [ ] `lsinitrd` — нет лишних модулей (floppy, pcspkr, лишние i2c)
- [ ] GRUB_CMDLINE_LINUX содержит нужные параметры

---

### 1.2 Сервисы: systemd + xdg-autostart

#### 🔍 Проверка (read-only)
```bash
# System services — enabled & active
systemctl list-unit-files --state=enabled --type=service | grep -v "static\|generated"

# Failed services
systemctl list-units --state=failed --type=service

# User services
systemctl --user list-unit-files --state=enabled --type=service
systemctl --user list-units --state=failed --type=service

# Critical chain
systemd-analyze critical-chain

# xdg-autostart (KDE генерирует из .desktop)
systemctl --user list-unit-files --type=service | grep xdg
ls ~/.config/autostart/ /etc/xdg/autostart/ 2>/dev/null | head -30
```

#### ⚙️ Оптимизация
```bash
# Уже сделано в предыдущей сессии:
# - Удалены 9 пакетов (qemu-guest-agent, open-vm-tools, iscsi, livesys, ModemManager, pcsc-lite, at, gssproxy, numad)
# - Отключены accounts-daemon, avahi-daemon (Plasma deps)

# Дополнительно: mask xdg-autostart для неиспользуемых
# Пример: xwaylandvideobridge (если не нужен XWayland video bridge)
systemctl --user mask app-org.kde.xwaylandvideobridge@autostart.service

# plasma-startupsound — если звук не нужен
systemctl --user mask plasma-startupsound.service

# windscribe-tray — если не пользуешься GUI
systemctl --user mask app-windscribe\x2dtray@autostart.service

# Handy (транскрипция): хоткей Insert не вставал при загрузке
# Причина: handy использует enigo/X11 для глобальных хоткеев, а systemd-xdg-autostart-generator
# стартует юнит раньше, чем KDE импортирует DISPLAY в user-менеджер → "DisplayParsingError(DisplayNotSet)".
# Фикс (в configs/handy/systemd/10-wait-x11.conf):
systemctl --user daemon-reload  # после размещения drop-in
# Drop-in: ~/.config/systemd/user/app-Handy@autostart.service.d/10-wait-x11.conf
#   ждёт /tmp/.X11-unix/X0 и задаёт DISPLAY=:0, WAYLAND_DISPLAY=wayland-0
```

#### ↩️ Откат
```bash
systemctl --user unmask app-org.kde.xwaylandvideobridge@autostart.service
systemctl --user unmask plasma-startupsound.service
systemctl --user unmask app-windscribe\x2dtray@autostart.service
```

#### ✅ Чек-лист
- [ ] `systemctl list-units --state=failed` — 0 system, минимально user
- [ ] Все enabled сервисы — понятны и нужны
- [ ] xdg-autostart маскированы только для неиспользуемых

---

### 1.3 Пакеты: fedora-package-manager.py

#### 🔍 Проверка (read-only)
```bash
cd ~/Projects/ai/synchronika/sync/scripts

# Топ-30 крупнейших
python3 fedora-package-manager.py

# Категории
python3 fedora-package-manager.py --categorized

# Листья (user-installed, без зависимостей) — кандидаты на удаление
python3 fedora-package-manager.py --leaves

# Дубликаты версий
python3 fedora-package-manager.py --duplicates

# Неизвестные репозитории
python3 fedora-package-manager.py --unknown-repos

# Flatpak
python3 fedora-package-manager.py --flatpak

# Полная сводка
python3 fedora-package-manager.py --summary

# JSON для парсинга
python3 fedora-package-manager.py --json > /tmp/pkg-audit.json
```

#### ⚙️ Оптимизация
```bash
# Удаление листьев (после ручной проверки списка!)
# python3 fedora-package-manager.py --leaves → выбрать пакеты → sudo dnf remove <pkg>

# Очистка дубликатов (осторожно!)
# python3 fedora-package-manager.py --clean-duplicates --apply

# Удаление пакетов из unknown-repos (если не нужны)
# sudo dnf remove <pkg-from-unknown-repo>

# Автоочистка слабых зависимостей (уже в dnf.conf: clean_requirements_on_remove=1)
sudo dnf autoremove
```

#### ↩️ Откат
```bash
# Реинсталл удалённых пакетов из лога
sudo dnf install <pkg1> <pkg2> ...

# Или из бэкапа packages-before.list
comm -23 <(sort scripts/backup/packages-before.list) <(rpm -qa | sort) | xargs sudo dnf install -y
```

#### ✅ Чек-лист
- [ ] `--leaves` — просмотрен, лишние удалены
- [ ] `--duplicates` — 0 (или только installonlypkgs: kernel)
- [ ] `--unknown-repos` — 0 (или осознанно оставленные)
- [ ] `dnf check` — clean

---

## 🎮 ФАЗА 2: ОПТИМИЗАЦИЯ (GPU + Memory/CPU)

### 2.1 NVIDIA/GPU Deep Tune

#### 🔍 Проверка
```bash
# Драйвер, GSP, прошивка
nvidia-smi
cat /proc/driver/nvidia/version
dmesg | grep -i gsp

# VA-API / VDPAU
vainfo
vdpauinfo

# Power management
cat /sys/bus/pci/devices/0000:03:00.0/power/runtime_status
nvidia-smi -q -d POWER

# Explicit sync (Wayland)
env | grep -i explicit
```

#### ⚙️ Оптимизация
```bash
# Уже в /etc/environment:
# MOZ_ENABLE_WAYLAND=1
# ENABLE_HDR_WSI=1
# MOZ_DISABLE_NVIDIA_HWACCEL_BLOCKLIST=1
# LIBVA_DRIVER_NAME=nvidia

# nvidia-powerd (уже установлен, проверить статус)
systemctl status nvidia-powerd

# GSP firmware — проверить загрузку
dmesg | grep -i "gsp\|firmware"

# VA-API в браузерах — проверить about:support / chrome://gpu
```

#### ✅ Чек-лист
- [ ] `vainfo` — показывает VA-API entrypoints (H264, HEVC, VP9, AV1)
- [ ] `nvidia-smi` — P-state не застревает в P0 (проверено ранее)
- [ ] Browser GPU acceleration — работает (WebGL, Video Decode)

---

### 2.2 Memory/CPU (ZSWAP, hugepages, sched-ext, IRQ)

#### 🔍 Проверка
```bash
# ZSWAP
cat /sys/module/zswap/parameters/enabled
cat /sys/module/zswap/parameters/max_pool_percent
cat /sys/module/zswap/parameters/compressor
zramctl

# Hugepages
cat /proc/meminfo | grep -i huge

# sched-ext (scx_bpfland)
systemctl status scx_loader
scx_bpfland --help 2>/dev/null | head -5

# IRQ affinity
cat /proc/interrupts | grep -E "nvidia|eth|nvme" | head -10

# CPU governor
cpupower frequency-info
```

#### ⚙️ Оптимизация
```bash
# ZSWAP — уже настроено через GRUB (zswap.max_pool_percent=100)
# Дополнительно: zstd compressor
echo zstd | sudo tee /sys/module/zswap/parameters/compressor

# Hugepages — для баз данных/VM (если не используешь — отключить)
# echo 0 | sudo tee /proc/sys/vm/nr_hugepages

# sched-ext — уже работает (scx_bpfland)
# Настройка профиля под нагрузку
# scx_bpfland -p balanced  # или latency, throughput

# IRQ affinity — разнести nvme, nvidia, network по разным ядрам
# Пример для NVMe (ядра 0-5):
# echo 3f | sudo tee /proc/irq/$(grep nvme /proc/interrupts | head -1 | awk '{print $1}' | tr -d :)/smp_affinity
```

#### ✅ Чек-лист
- [ ] ZSWAP активен, компрессор zstd
- [ ] Hugepages = 0 (если не нужны)
- [ ] sched-ext загружен, профиль выбран
- [ ] IRQ разнесены по NUMA/CCX

---

## ✂️ ФАЗА 3: TRIM (KDE + Security)

### 3.1 KDE/Plasma Trim

#### 🔍 Проверка
```bash
# Akonadi
systemctl --user status akonadi.service
akonadictl status

# Baloo (файловый индексатор)
balooctl status
balooctl config

# KRunner плагины
krunner --list-plugins 2>/dev/null | head -20

# KCM модули
kcmshell6 --list | head -30

# Неиспользуемые plasma-applets
ls /usr/share/plasma/plasmoids/ | wc -l
```

#### ⚙️ Оптимизация
```bash
# Akonadi — если не пользуешься KMail/KOrganizer/Контактами
systemctl --user disable --now akonadi.service
# Удалить пакеты (осторожно — тянет kdepim)
# sudo dnf remove akonadi kdepim-runtime

# Baloo — отключить индексацию
balooctl disable
balooctl config set indexingEnabled false
# Или полностью: sudo dnf remove baloo5-file baloo5-kioslave

# KRunner — оставить только нужные (программы, терминал, калькулятор)
# Настройка в: Настройки → Поиск → KRunner

# Plasma theme — лёгкая (Breeze, не heavy)
```

#### ↩️ Откат
```bash
systemctl --user enable --now akonadi.service
balooctl enable
# Реинсталл пакетов если удаляли
```

#### ✅ Чек-лист
- [ ] Akonadi: disabled (или оставлен осознанно)
- [ ] Baloo: disabled (или оставлен осознанно)
- [ ] KRunner: только нужные плагины

---

### 3.2 Security Hardening (базовый)

#### 🔍 Проверка
```bash
# SELinux
sestatus
cat /etc/selinux/config

# systemd sandboxing для своих сервисов
systemctl --user show mouse-chord.service --property=DynamicUser,ProtectSystem,PrivateTmp

# Kernel lockdown
cat /sys/kernel/security/lockdown

# Firewall
firewall-cmd --list-all-zones
```

#### ⚙️ Оптимизация
```bash
# SELinux — уже Enforcing (targeted), оставить

# systemd sandboxing для своих сервисов
# Добавить в .service файлы:
# DynamicUser=yes
# ProtectSystem=strict
# PrivateTmp=yes
# NoNewPrivileges=yes
# Пример для mouse-chord:
cat >> ~/.config/systemd/user/mouse-chord.service << 'EOF'
DynamicUser=yes
ProtectSystem=strict
PrivateTmp=yes
NoNewPrivileges=yes
CapabilityBoundingSet=CAP_DAC_OVERRIDE CAP_SYS_ADMIN
EOF
systemctl --user daemon-reload
systemctl --user restart mouse-chord.service

# Kernel lockdown — включить (если Secure Boot)
# sudo mokutil --enable-lockdown  # требует перезагрузки и MOK enrollment

# Firewall — минимальные зоны
# Уже сделано: docker-forwarding удалена
firewall-cmd --permanent --set-default-zone=FedoraWorkstation
firewall-cmd --reload
```

#### ✅ Чек-лист
- [ ] SELinux = Enforcing
- [ ] Свои сервисы в sandbox (DynamicUser, ProtectSystem)
- [ ] Firewall — только нужные порты/зоны

---

## 🧭 ФАЗА 4: СТРАТЕГИЯ (Declarative — да/нет)

### Решение: **Пропустить декларативный переход (declarative_skip)**

**Почему:**
- Классический DNF + runbook уже работает воспроизводимо
- rpm-ostree/bootc требуют переустановки системы
- sysext — для расширений, не для базовой системы
- Текущий подход: git + dnf + runbook = полная воспроизводимость

**Когда пересмотреть:**
- Если появится потребность в atomic updates/rollback на уровне ОС
- Если Fedora выкатит официальный immutable variant (Silverblue/Kinoite) под KDE

---

## 📦 АРТЕФАКТЫ В РЕПОЗИТОРИИ

```
xeon-gtx-fedora-workstation/
├── docs/
│   ├── en/system/
│   │   ├── services-and-bloat.md
│   │   ├── dnf-audit.md
│   │   └── runbook.md          ← этот файл (EN версия)
│   └── ru/system/
│       ├── services-and-bloat.md
│       ├── dnf-audit.md
│       └── runbook.md          ← этот файл (RU версия)
├── configs/
│   └── zen-browser/
│       ├── user.js
│       └── user.ru.js
├── scripts/
│   ├── backup/
│   │   ├── services-enabled-before.list
│   │   └── packages-before.list
│   ├── optimize.sh
│   ├── check.sh
│   └── README.md
└── README.md / README.ru.md
```

---

## 🚀 QUICK START (для новой машины)

```bash
# 1. Клонировать
git clone https://github.com/uladziislau/xeon-gtx-fedora-workstation.git
cd xeon-gtx-fedora-workstation

# 2. Применить фундамент (Фаза 1)
sudo ./scripts/optimize.sh --phase=foundation

# 3. Применить оптимизацию (Фаза 2)
sudo ./scripts/optimize.sh --phase=optimization

# 4. Применить trim (Фаза 3)
sudo ./scripts/optimize.sh --phase=trim

# 5. Проверить
./scripts/check.sh
```

---

## 📝 ЖУРНАЛ ИЗМЕНЕНИЙ (Changelog)

| Дата | Фаза | Что сделано | Коммит |
|------|------|-------------|--------|
| 2026-08-19 | 1 | Краш-анализ, 3 сервиса, 14 DNF репо, dnf.conf | bc3b3ee |
| 2026-08-19 | 1 | v4l2loopback, bluetooth, windscribe, firewalld | 67930b1 |
| — | 1 | Пакеты (fedora-package-manager) — в планах | — |
| — | 2 | GPU/CPU глубокая настройка — в планах | — |
| — | 3 | KDE/Security trim — в планах | — |

---

## 🔗 ССЫЛКИ НА ИНСТРУМЕНТЫ

- **fedora-package-manager.py** — `~/Projects/ai/synchronika/sync/scripts/`
- **major-upgrade.sh** — `~/Projects/ai/synchronika/tools/scripts/`
- **package-strategy.md** — `~/Projects/ai/synchronika/sync/devices/xeon/software/`

---

*Runbook создан: 2026-08-19 | Версия: 1.0 | Для: Xeon E5-2696 v3 + GTX 1660 SUPER + Fedora 44 KDE/Wayland*