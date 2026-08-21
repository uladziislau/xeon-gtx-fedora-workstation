# 📦 Аудит DNF репозиториев и конфигурации

> Убираем мёртвые репозитории и закаляем конфигурацию DNF для лёгкой, воспроизводимой системы.

## Результат (применено 2026-08-19)

### Удалены мёртвые репозитории (14 файлов)

| Файл репозитория | Причина |
|------------------|---------|
| `mullvad.repo` | Mullvad VPN — не используется (WireGuard/другие) |
| `protonvpn-stable.repo` | ProtonVPN — не используется |
| `_copr:copr.fedorainfracloud.org:mikaeldui:kernel-cachyos.repo` | Дубликат kernel COPR (используем `bieszczaders`) |
| `windsurf.repo` | Windsurf IDE — мёртвое репо, не используется |
| `warpdotdev.repo` | Warp Terminal — установлен через RPM, репо не нужно |
| `docker-ce.repo` | Docker — не используется (Podman предпочтительнее) |
| `nvidia-container-toolkit.repo` | NVIDIA container toolkit — не используется |
| `antigravity.repo` | Неизвестное/заброшенное репо |
| `_copr:copr.fedorainfracloud.org:boria138:portproton.repo` | PortProton — не используется |
| `_copr:copr.fedorainfracloud.org:wehagy:protonplus.repo` | ProtonPlus — не используется |
| `google-chrome.repo.rpmsave` | Устаревший бэкап |
| `_copr:copr.fedorainfracloud.org:phracek:PyCharm.repo.rpmsave` | Устаревший бэкап |
| `rpmfusion-nonfree-nvidia-driver.repo.rpmsave` | Устаревший бэкап |
| `rpmfusion-nonfree-steam.repo.rpmsave` | Устаревший бэкап |

**Кэш очищен:** `sudo dnf clean all` (освобождено ~2 GiB)

### Активные репозитории после очистки

```
copr:copr.fedorainfracloud.org:bieszczaders:kernel-cachyos
copr:copr.fedorainfracloud.org:bieszczaders:kernel-cachyos-addons
copr:copr.fedorainfracloud.org:varlad:zellij
cuda-fedora44-x86_64
cursor
fedora
fedora-cisco-openh264
rpmfusion-free
rpmfusion-free-updates
rpmfusion-nonfree
rpmfusion-nonfree-updates
tailscale-stable
terra
updates
```

### dnf.conf закален

**Было:**
```ini
[main]
fastestmirror=True
max_parallel_downloads=10
```

**Стало (`/etc/dnf/dnf.conf`):**
```ini
[main]
fastestmirror=True
max_parallel_downloads=10
keepcache=0
clean_requirements_on_remove=1
install_weak_deps=0
```

| Настройка | Значение | Причина |
|-----------|----------|---------|
| `keepcache` | `0` | Не хранить скачанные RPM после установки (экономит диск) |
| `clean_requirements_on_remove` | `1` | Авто-удалить ненужные зависимости при удалении пакетов |
| `install_weak_deps` | `0` | Не ставить слабые зависимости (recommends/supplements) — только явный контроль |

---

## Как откатить

```bash
# Восстановить файлы репо из бэкапа (если делали) или добавить вручную:
# Пример для Mullvad:
sudo dnf config-manager --add-repo https://repository.mullvad.net/rpm/stable/mullvad.repo

# Сбросить dnf.conf к минимуму:
sudo tee /etc/dnf/dnf.conf > /dev/null << 'EOF'
[main]
fastestmirror=True
max_parallel_downloads=10
EOF
```

---

## Что проверено

- `dnf repolist --enabled` → активны только нужные репо
- `dnf check` → нет проблем с зависимостями
- `sudo dnf upgrade --refresh --dry-run` → проходит чисто
- Освобождено дисковое пространство: ~2 GiB от очистки кэша
---

## Аудит «веса»: X11-стек и firewalld (проверено 2026-08-21)

Вопрос: сколько занимают X11 и firewalld, и что реально можно снять.

### Итог в двух словах

- **«Вес» X11 на этой машине — это NVIDIA-драйвер, а не X11.** Снимать его нельзя:
  вместе с DDX уходят `akmod-nvidia` и обе kmod сборки ядра (проверено
  `dnf remove --assumeno`). Wayland/KDE и CUDA на GTX 1660 SUPER требуют драйвер.
- **Реальный безопасный выигрыш маленький**: 6.4 MB `*-devel` заголовков.
- **firewalld**: 2.2 MB диска + **~53 MB RAM** постоянно. Ни один пакет от него
  не зависит. Это единственный заметный «вес», который убирается безопасно.

### Точные цифры

```text
Всего установлено пакетов:            2755

X11-стек (51 пакет, имена ^libX11|^libxcb|^xorg…)  1156 MB
├── NVIDIA проприетарный (10 пакетов)            ~1025 MB   ← обязателен
│     xorg-x11-drv-nvidia-cuda-libs                504 MB   (CUDA)
│     xorg-x11-drv-nvidia-libs                     337 MB   (GLX/EGL)
│     xorg-x11-drv-nvidia (DDX)                    173 MB
│     xorg-x11-drv-nvidia-kmodsrc                  101 MB   (akmod-nvidia)
│     прочее nvidia (power, xorg-libs, cuda)        ~21 MB
├── XWayland (2.7 MB) + xwaylandvideobridge        — нужен для X11-приложений
├── *-devel заголовки (16 шт.)                      6.4 MB   ← можно снять
└── библиотеки (libX11, libxcb, libXtst, …)        ~15 MB  (нужны Qt/XWayland)

firewalld                                            2.2 MB диска + ~53 MB RAM
```

### Выводы

1. **Удаление X11 «целиком» = удаление видеодрайвера** (14 пакетов, 1 GiB) —
   ломает ускорение/Wayland/CUDA. Не делать.
2. **Можно безопасно снять** (если не собираете софт с X11):
   ```bash
   sudo dnf remove 'libX11-devel' 'libxcb-devel' 'xorg-x11-proto-devel' \
     'libX*-devel' 'libxkbcommon*-devel'
   ```
   → 6.4 MB, 16 пакетов.
3. **firewalld** — кандидат на отключение/удаление за NAT-роутером:
   ```bash
   sudo systemctl disable --now firewalld   # экономит ~53 MB RAM
   # или полное удаление: sudo dnf remove firewalld
   ```
   Для простого десктопа правила проще держать в nftables (если вообще нужны).
4. Если CUDA-разработка не планируется — `xorg-x11-drv-nvidia-cuda-libs`
   (504 MB) тоже кандидат, но **только вместе с удалением всего nvidia-стека**
   (отдельно оно не уходит из-за связки через DDX-метапакет).
