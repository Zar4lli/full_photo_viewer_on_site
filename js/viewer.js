(function () {
    const triggers = [...document.querySelectorAll('[data-viewer]')];
    if (!triggers.length) return;

    const images = triggers.map((el, index) => ({
        element: el,
        src: el.getAttribute('data-viewer') || el.getAttribute('src'),
        name: el.getAttribute('data-title') || el.getAttribute('alt') || `Изображение ${index + 1}`
    }));

    const overlay = document.createElement('div');
    overlay.className = 'viewer-overlay';
    overlay.innerHTML = `
        <div class="viewer-toolbar">
            <div class="viewer-controls">
                <button class="viewer-btn" data-action="zoom-out" type="button">−</button>
                <button class="viewer-btn" data-action="zoom-in" type="button">+</button>
                <button class="viewer-btn" data-action="reset" type="button">Сброс</button>
                <button class="viewer-btn" data-action="close" type="button">✕</button>
            </div>
        </div>

        <button class="viewer-nav prev" data-action="prev" type="button">‹</button>
        <button class="viewer-nav next" data-action="next" type="button">›</button>

        <div class="viewer-stage">
            <img class="viewer-image" src="" alt="">
        </div>

        <div class="viewer-info"></div>
    `;
    document.body.appendChild(overlay);

    const stage = overlay.querySelector('.viewer-stage');
    const image = overlay.querySelector('.viewer-image');
    const info = overlay.querySelector('.viewer-info');

    let currentIndex = 0;
    let baseScale = 1;
    let scale = 1;
    let translateX = 0;
    let translateY = 0;

    const minScale = 0.15;
    const maxScale = 8;
    const zoomStep = 0.25;
    const closeThresholdFactor = 0.55;

    const activePointers = new Map();
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let startTranslateX = 0;
    let startTranslateY = 0;

    let swipeStartX = 0;
    let swipeStartY = 0;
    let swipeMoved = false;

    let pinchStartDistance = 0;
    let pinchStartScale = 1;
    let pinchImagePointX = 0;
    let pinchImagePointY = 0;
    let pinchActive = false;

    function isMobile() {
        return window.innerWidth <= 768;
    }

    function getEdgePaddingX() {
        return isMobile() ? 220 : 320;
    }

    function getEdgePaddingY() {
        return isMobile() ? 160 : 220;
    }

    function isOpen() {
        return overlay.classList.contains('active');
    }

    function updateTransform() {
        image.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    }

    function calculateBaseScale() {
        const rect = stage.getBoundingClientRect();
        const imgW = image.naturalWidth;
        const imgH = image.naturalHeight;

        if (!imgW || !imgH || !rect.width || !rect.height) {
            baseScale = 1;
            return;
        }

        const padding = isMobile() ? 24 : 40;
        const availableW = Math.max(100, rect.width - padding);
        const availableH = Math.max(100, rect.height - padding);

        baseScale = Math.min(availableW / imgW, availableH / imgH);
        baseScale = Math.min(baseScale, 1);
    }

    function resetTransform() {
        calculateBaseScale();
        scale = baseScale;
        translateX = 0;
        translateY = 0;
        updateTransform();
        updateInfo();
    }

    function clampTranslate() {
        const rect = stage.getBoundingClientRect();
        const imgW = image.naturalWidth * scale;
        const imgH = image.naturalHeight * scale;

        const padX = getEdgePaddingX();
        const padY = getEdgePaddingY();

        const maxX = Math.max(padX, (imgW - rect.width) / 2 + padX);
        const maxY = Math.max(padY, (imgH - rect.height) / 2 + padY);

        translateX = Math.min(maxX, Math.max(-maxX, translateX));
        translateY = Math.min(maxY, Math.max(-maxY, translateY));
    }

    function updateInfo() {
        const percent = Math.round(scale * 100);
        info.textContent = `${currentIndex + 1} / ${images.length} — ${images[currentIndex].name} — ${percent}%`;
    }

    function applyScaleBehavior() {
        clampTranslate();
        updateTransform();
        updateInfo();
    }

    function shouldCloseByZoom(targetScale) {
        return targetScale < baseScale * closeThresholdFactor;
    }

    function showImage(index) {
        currentIndex = (index + images.length) % images.length;
        const item = images[currentIndex];

        image.onload = function () {
            resetTransform();
        };

        image.src = item.src;
        image.alt = item.name;
    }

    function openViewer(index) {
        currentIndex = index;
        overlay.classList.add('active');
        document.body.classList.add('lock');
        showImage(index);
    }

    function closeViewer() {
        overlay.classList.remove('active');
        document.body.classList.remove('lock');
        image.src = '';
        image.alt = '';
        activePointers.clear();
        stage.classList.remove('dragging');
        isDragging = false;
        pinchActive = false;
    }

    function nextImage() {
        showImage(currentIndex + 1);
    }

    function prevImage() {
        showImage(currentIndex - 1);
    }

    function zoomAtPoint(targetScale, clientX, clientY) {
        if (shouldCloseByZoom(targetScale)) {
            closeViewer();
            return;
        }

        const rect = stage.getBoundingClientRect();
        const oldScale = scale;
        const newScale = Math.max(minScale, Math.min(maxScale, targetScale));

        const stageCenterX = rect.width / 2;
        const stageCenterY = rect.height / 2;

        const localX = clientX - rect.left - stageCenterX;
        const localY = clientY - rect.top - stageCenterY;

        const imagePointX = (localX - translateX) / oldScale;
        const imagePointY = (localY - translateY) / oldScale;

        scale = newScale;
        translateX = localX - imagePointX * scale;
        translateY = localY - imagePointY * scale;

        applyScaleBehavior();
    }

    function zoom(direction, clientX = null, clientY = null) {
        const rect = stage.getBoundingClientRect();
        const fallbackX = rect.left + rect.width / 2;
        const fallbackY = rect.top + rect.height / 2;

        const pointX = clientX ?? fallbackX;
        const pointY = clientY ?? fallbackY;

        let targetScale = scale;

        if (direction > 0) {
            targetScale = +(scale + zoomStep).toFixed(2);
        } else {
            targetScale = +(scale - zoomStep).toFixed(2);
        }

        zoomAtPoint(targetScale, pointX, pointY);
    }

    function distanceBetween(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return Math.hypot(dx, dy);
    }

    function centerBetween(a, b) {
        return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    }

    function getPointersArray() {
        return [...activePointers.values()];
    }

    function beginDrag(pointer) {
        isDragging = true;
        stage.classList.add('dragging');
        dragStartX = pointer.x;
        dragStartY = pointer.y;
        startTranslateX = translateX;
        startTranslateY = translateY;
    }

    function updateDrag(pointer) {
        translateX = startTranslateX + (pointer.x - dragStartX);
        translateY = startTranslateY + (pointer.y - dragStartY);
        clampTranslate();
        updateTransform();
    }

    function endDrag() {
        isDragging = false;
        stage.classList.remove('dragging');
    }

    function startPinch() {
        const pts = getPointersArray();
        if (pts.length < 2) return;

        pinchActive = true;
        endDrag();

        pinchStartDistance = distanceBetween(pts[0], pts[1]);
        pinchStartScale = scale;

        const rect = stage.getBoundingClientRect();
        const center = centerBetween(pts[0], pts[1]);

        const stageCenterX = rect.width / 2;
        const stageCenterY = rect.height / 2;

        const localX = center.x - rect.left - stageCenterX;
        const localY = center.y - rect.top - stageCenterY;

        pinchImagePointX = (localX - translateX) / scale;
        pinchImagePointY = (localY - translateY) / scale;
    }

    function updatePinch() {
        const pts = getPointersArray();
        if (pts.length < 2 || !pinchActive) return;

        const currentDistance = distanceBetween(pts[0], pts[1]);
        if (!pinchStartDistance) return;

        const rect = stage.getBoundingClientRect();
        const center = centerBetween(pts[0], pts[1]);

        const stageCenterX = rect.width / 2;
        const stageCenterY = rect.height / 2;

        const localX = center.x - rect.left - stageCenterX;
        const localY = center.y - rect.top - stageCenterY;

        let newScale = pinchStartScale * (currentDistance / pinchStartDistance);

        if (shouldCloseByZoom(newScale)) {
            closeViewer();
            return;
        }

        newScale = Math.max(minScale, Math.min(maxScale, newScale));

        scale = newScale;
        translateX = localX - pinchImagePointX * scale;
        translateY = localY - pinchImagePointY * scale;

        applyScaleBehavior();
    }

    triggers.forEach((el, index) => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            openViewer(index);
        });
    });

    overlay.addEventListener('click', (e) => {
        const action = e.target.closest('[data-action]')?.dataset.action;
        if (action === 'close') closeViewer();
        if (action === 'zoom-in') zoom(1);
        if (action === 'zoom-out') zoom(-1);
        if (action === 'reset') resetTransform();
        if (action === 'prev') prevImage();
        if (action === 'next') nextImage();

        if (e.target === overlay) {
            closeViewer();
        }
    });

    stage.addEventListener('wheel', (e) => {
        if (!isOpen()) return;
        e.preventDefault();
        zoom(e.deltaY < 0 ? 1 : -1, e.clientX, e.clientY);
    }, { passive: false });

    stage.addEventListener('pointerdown', (e) => {
        if (!isOpen()) return;

        stage.setPointerCapture(e.pointerId);

        activePointers.set(e.pointerId, {
            x: e.clientX,
            y: e.clientY,
            type: e.pointerType
        });

        const pts = getPointersArray();

        if (pts.length === 1) {
            swipeStartX = e.clientX;
            swipeStartY = e.clientY;
            swipeMoved = false;

            if (scale > baseScale) {
                beginDrag({ x: e.clientX, y: e.clientY });
            }
        } else if (pts.length === 2) {
            startPinch();
        }
    });

    stage.addEventListener('pointermove', (e) => {
        if (!isOpen()) return;
        if (!activePointers.has(e.pointerId)) return;

        const prev = activePointers.get(e.pointerId);
        activePointers.set(e.pointerId, {
            ...prev,
            x: e.clientX,
            y: e.clientY
        });

        const pts = getPointersArray();

        if (pts.length === 2) {
            pinchActive = true;
            updatePinch();
            return;
        }

        if (pts.length === 1) {
            const dx = e.clientX - swipeStartX;
            const dy = e.clientY - swipeStartY;

            if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
                swipeMoved = true;
            }

            if (scale > baseScale && isDragging) {
                updateDrag({ x: e.clientX, y: e.clientY });
            }
        }
    });

    function finishPointer(e) {
        if (!activePointers.has(e.pointerId)) return;

        const endPoint = activePointers.get(e.pointerId);
        activePointers.delete(e.pointerId);

        const pts = getPointersArray();

        if (pinchActive && pts.length < 2) {
            pinchActive = false;

            if (pts.length === 1 && scale > baseScale) {
                beginDrag(pts[0]);
            }
        }

        if (isDragging && pts.length === 0) {
            endDrag();
        }

        if (!pinchActive && pts.length === 0 && scale <= baseScale) {
            const dx = endPoint.x - swipeStartX;
            const dy = endPoint.y - swipeStartY;

            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
                if (dx < 0) nextImage();
                else prevImage();
                return;
            }

            if (!swipeMoved) {
                closeViewer();
            }
        }
    }

    stage.addEventListener('pointerup', finishPointer);
    stage.addEventListener('pointercancel', finishPointer);

    document.addEventListener('keydown', (e) => {
        if (!isOpen()) return;

        if (e.key === 'Escape') closeViewer();
        else if (e.key === 'ArrowRight') nextImage();
        else if (e.key === 'ArrowLeft') prevImage();
        else if (e.key === '+' || e.key === '=') zoom(1);
        else if (e.key === '-') zoom(-1);
    });

    window.addEventListener('resize', () => {
        if (isOpen()) resetTransform();
    });
})();