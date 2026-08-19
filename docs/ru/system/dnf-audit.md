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