# 📷 Full Photo Viewer (Vanilla JS)

Лёгкий и быстрый **photo viewer** на чистом JavaScript без зависимостей.
Подходит для галерей, карточек товаров, портфолио и любых изображений на сайте.

---

## 🚀 Возможности

* Fullscreen overlay (как в современных галереях)
* Переключение между изображениями
* Zoom (колесо мыши / pinch)
* Перетаскивание увеличенного изображения
* Поддержка свайпов на мобильных
* Закрытие по `Esc`, клику или жесту
* Никаких библиотек (vanilla JS)

---

## 📦 Установка

Просто скопируй файлы в проект:

```
css/viewer.css
js/viewer.js
```

И подключи:

```html
<link rel="stylesheet" href="css/viewer.css">
<script src="js/viewer.js" defer></script>
```

---

## ⚡ Быстрый старт

Самый простой вариант:

```html
<img src="image.jpg" data-viewer>
```

Готово — при клике откроется viewer.

---

## 🧠 Как использовать

### 1. Базовое использование

```html
<img src="images/photo.jpg" data-viewer>
```

---

### 2. Отдельная большая версия

```html
<img 
  src="images/thumb.jpg" 
  data-viewer="images/full.jpg"
>
```

---

### 3. С заголовком

```html
<img 
  src="images/photo.jpg"
  data-viewer
  data-title="Название изображения"
>
```

---

## 🧩 Атрибуты

| Атрибут             | Описание               |
| ------------------- | ---------------------- |
| `data-viewer`       | включает viewer        |
| `data-viewer="url"` | путь к большой версии  |
| `data-title`        | текст под изображением |
| `alt`               | fallback для названия  |

---

## 🖥 Управление

### Desktop

* Клик — открыть
* `Esc` — закрыть
* `← / →` — переключение
* Колесо — zoom
* Drag — перемещение

---

### Mobile

* Tap — открыть
* Swipe — переключение
* Pinch — zoom
* Tap вне — закрыть

---

## 🧱 Пример галереи

```html
<link rel="stylesheet" href="css/viewer.css">

<div class="gallery">
  <img src="img/1.jpg" data-viewer data-title="Фото 1">
  <img src="img/2.jpg" data-viewer data-title="Фото 2">
  <img src="img/3.jpg" data-viewer="img/3-large.jpg">
</div>

<script src="js/viewer.js" defer></script>
```

---

## 📁 Структура проекта

```
project/
├── css/
│   └── viewer.css
├── js/
│   └── viewer.js
└── index.html
```

---

## ⚠️ Ограничения

* Работает с изображениями, которые уже есть в DOM
* Динамически добавленные изображения нужно инициализировать отдельно
* Нет встроенного lazy-loading

---

## 🛠 Возможные улучшения

* API для инициализации
* Поддержка динамических галерей
* Анимации открытия
* Поддержка видео

---

## 📄 Лицензия

MIT — используйте как хотите, но с указанием автора.

---

## 👤 Автор

Zar4lli
