# 💻 CLI Cheatsheet: Fedora Workstation

> Сборник полезных команд для настройки, диагностики и управления системой на базе Xeon + NVIDIA.

**📖 [Индекс документации →](README.md)** | **🇺🇸 [English version →](../en/cli-cheatsheet.md)**

---

## 🔍 Быстрая диагностика

### Проверка параметров загрузки ядра
Убедиться, что все флаги (zswap, clear_cpuid и др.) применились:

```bash
cat /proc/cmdline
```

### Видит ли браузер переменные окружения?
Если вывод пуст — аппаратное ускорение в браузере не заведется:

```bash
env | grep MOZ
```

### Работает ли аппаратное ускорение видео (VA-API)?
Должен отобразиться список кодеков (VP9, HEVC и т.д.):

```bash
vainfo --display wayland
```

### Статус планировщика (scx)
Проверка, какой eBPF планировщик сейчас управляет ядрами:

```bash
systemctl status scx-* --no-pager
```

---

## 🖥️ Система и Ядро

### Обновление загрузчика GRUB
Применяет изменения после редактирования `/etc/default/grub`:

```bash
sudo grub2-mkconfig -o /boot/grub2/grub.cfg
```

### Управление переменными окружения
Быстрая перезапись файла переменных (копируйте весь блок):

```bash
sudo bash -c 'cat <<EOF > /etc/environment
LIBVA_DRIVER_NAME=nvidia
NVD_BACKEND=direct
MOZ_ENABLE_WAYLAND=1
...
EOF'
```

---

## 🎨 Графика и Видео (GPU)

### Мониторинг видеокарты (Коротко)
Проверка памяти, частот и температуры GPU:

```bash
nvidia-smi
```

### Декодирование видео (NVDEC)
Смотреть колонку 'dec'. Если > 0 при просмотре YouTube — видеокарта работает:

```bash
nvidia-smi dmon -s u
```

### Информация о дисплеях
Детальная информация о подключенных мониторах (модель, режимы):

```bash
kscreen-doctor -o
```

---

## ⚡ Процессор и Питание

### Мониторинг частот (Простой)
Показывает текущую частоту всех ядер в реальном времени:

```bash
watch -n1 "grep 'MHz' /proc/cpuinfo"
```

### Мониторинг частот и питания (Профессиональный)
Показывает реальную частоту под нагрузкой, ватты (PkgWatt) и C-states:

```bash
sudo turbostat --quiet --interval 1 --show Bzy_MHz,PkgWatt,CorWatt,GFXWatt,IRQ
```

### Управление профилем питания
Установить режим "Производительность":

```bash
powerprofilesctl set performance
```

Проверить текущий профиль:

```bash
powerprofilesctl list
```

### Проверка драйвера частоты
Убедиться, что все ядра в режиме 'performance':

```bash
cat /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor | sort | uniq
```

---

## 💾 Память (RAM)

### Проверка Hugepages
Должно быть выбрано `[always]`:

```bash
cat /sys/kernel/mm/transparent_hugepage/enabled
```

### Проверка ZSWAP
Процент использования памяти под сжатый буфер (должен быть 100):

```bash
cat /sys/module/zswap/parameters/max_pool_percent
```

---

## 🖼️ KDE Plasma и Интерфейс

### Изменение DPI шрифтов
Принудительная установка DPI (например, 120 для 2K монитора):

```bash
kwriteconfig6 --file kcmfonts --group General --key forceFontDPI 120
```

### Перезапуск сессии (Logout)
Безопасный выход из системы через терминал (для применения настроек графики):

```bash
loginctl terminate-session self
```

### Перезапуск оболочки Plasma
Если "заглючила" панель или плазмоиды (без закрытия окон):

```bash
kquitapp6 plasmashell || killall plasmashell && kstart plasmashell
```

### Отключение индексатора Baloo
Если `baloo_file` грузит диск:

```bash
balooctl6 disable
```

### Сброс кэша шрифтов
Выполнять после изменения конфигов Fontconfig:

```bash
fc-cache -f -v
```

---

## 🧠 Планировщики (Sched-ext)

### Управление службами
Включить конкретный планировщик (например, BPFland):

```bash
sudo systemctl enable --now scx-bpfland
```

Проверить статус:

```bash
systemctl status scx-bpfland --no-pager
```

---

## 🌐 Браузеры

### Обновление ярлыка (Desktop Entry)
Обновляет базу данных ярлыков после ручного редактирования `.desktop` файлов:

```bash
update-desktop-database ~/.local/share/applications/
```

### Запуск Thorium с отладкой
Если нужно проверить флаги через терминал:

```bash
thorium-browser --enable-features=VaapiVideoDecoder --disable-features=VaapiVideoDecodeLinuxGL --use-gl=angle --ozone-platform=wayland
```

### Запуск Thorium с выводом ошибок GPU
Если аппаратное ускорение "отвалилось", запускаем так и смотрим логи:

```bash
thorium-browser --enable-logging=stderr --v=1
```

---

## 🔧 Обслуживание и Fix-It команды

### Очистка системы от мусора
Очистка кэша пакетов DNF и старых метаданных:

```bash
sudo dnf clean all && sudo dnf makecache
```

---

## 📚 Связанная документация

- **[Системные настройки](system/core-setup.md)** - Параметры ядра и GRUB
- **[Графика и дисплей](graphics/display.md)** - Конфигурация NVIDIA Wayland
- **[Решение проблем](troubleshooting/index.md)** - Частые проблемы и решения
