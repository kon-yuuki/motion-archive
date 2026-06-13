const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export function initDraggablePanel(panel) {
  const handle = panel.querySelector("[data-drag-handle]");
  const boundary = panel.offsetParent;

  if (!handle || !boundary) return () => {};

  let drag;

  function positionPanel(left, top) {
    const maxLeft = Math.max(0, boundary.clientWidth - panel.offsetWidth);
    const maxTop = Math.max(0, boundary.clientHeight - panel.offsetHeight);

    panel.style.left = `${clamp(left, 0, maxLeft)}px`;
    panel.style.top = `${clamp(top, 0, maxTop)}px`;
    panel.style.right = "auto";
    panel.style.bottom = "auto";
  }

  function startDrag(event) {
    if (event.button !== 0) return;

    const panelRect = panel.getBoundingClientRect();
    const boundaryRect = boundary.getBoundingClientRect();

    drag = {
      pointerId: event.pointerId,
      offsetX: event.clientX - panelRect.left,
      offsetY: event.clientY - panelRect.top,
      boundaryLeft: boundaryRect.left,
      boundaryTop: boundaryRect.top
    };

    panel.setAttribute("data-dragging", "");
    handle.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  function moveDrag(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;

    if ((event.buttons & 1) === 0) {
      stopDrag(event);
      return;
    }

    positionPanel(
      event.clientX - drag.boundaryLeft - drag.offsetX,
      event.clientY - drag.boundaryTop - drag.offsetY
    );
  }

  function stopDrag(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;

    const pointerId = drag.pointerId;
    panel.removeAttribute("data-dragging");
    drag = undefined;

    if (handle.hasPointerCapture(pointerId)) {
      handle.releasePointerCapture(pointerId);
    }
  }

  function cancelDrag() {
    panel.removeAttribute("data-dragging");
    drag = undefined;
  }

  function keepInsideBoundary() {
    if (!panel.style.left) return;
    positionPanel(panel.offsetLeft, panel.offsetTop);
  }

  function moveWithKeyboard(event) {
    const directions = {
      ArrowDown: [0, 1],
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1]
    };
    const direction = directions[event.key];

    if (!direction) return;

    const distance = event.shiftKey ? 1 : 10;
    positionPanel(
      panel.offsetLeft + direction[0] * distance,
      panel.offsetTop + direction[1] * distance
    );
    event.preventDefault();
  }

  handle.addEventListener("pointerdown", startDrag);
  handle.addEventListener("pointermove", moveDrag);
  handle.addEventListener("pointerup", stopDrag);
  handle.addEventListener("pointercancel", stopDrag);
  handle.addEventListener("lostpointercapture", stopDrag);
  handle.addEventListener("keydown", moveWithKeyboard);
  window.addEventListener("pointerup", stopDrag);
  window.addEventListener("pointercancel", stopDrag);
  window.addEventListener("blur", cancelDrag);
  window.addEventListener("resize", keepInsideBoundary);

  return () => {
    handle.removeEventListener("pointerdown", startDrag);
    handle.removeEventListener("pointermove", moveDrag);
    handle.removeEventListener("pointerup", stopDrag);
    handle.removeEventListener("pointercancel", stopDrag);
    handle.removeEventListener("lostpointercapture", stopDrag);
    handle.removeEventListener("keydown", moveWithKeyboard);
    window.removeEventListener("pointerup", stopDrag);
    window.removeEventListener("pointercancel", stopDrag);
    window.removeEventListener("blur", cancelDrag);
    window.removeEventListener("resize", keepInsideBoundary);
  };
}

export function initDraggablePanels(root = document) {
  return [...root.querySelectorAll("[data-draggable-panel]")].map(initDraggablePanel);
}
