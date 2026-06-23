import { useState, useEffect, useRef, useCallback } from 'react';

export const DESKTOP_CANVAS_DEFAULT_ZOOM = 0.76;
export const DESKTOP_CANVAS_MIN_SCALE = 0.25;
export const DESKTOP_CANVAS_MAX_SCALE = 2;
export const DESKTOP_CANVAS_SCALE_STEP = 0.12;
export const DESKTOP_APP_WINDOW_SCALE = 0.76;
export const DESKTOP_FIXED_UI_SCALE = 0.95;

const DESKTOP_MAIN_CONTENT_MAX_WIDTH = 1008;

export const clampDesktopCanvasScale = (value) =>
  Math.min(DESKTOP_CANVAS_MAX_SCALE, Math.max(DESKTOP_CANVAS_MIN_SCALE, value));

const screenToCanvas = (screenX, screenY, vp) => ({
  x: screenX - vp.panX,
  y: screenY - vp.panY,
});

/**
 * Custom hook to manage canvas viewport zoom, pan, and coordinate translation helper states.
 *
 * @param {Object} params
 * @param {Object} params.desktopDragContainerRectRef
 */
export const useDesktopViewportState = ({ desktopDragContainerRectRef }) => {
  const [viewport, setViewport] = useState({
    panX: 0,
    panY: 0,
    zoom: DESKTOP_CANVAS_DEFAULT_ZOOM,
  });
  const viewportRef = useRef({
    panX: 0,
    panY: 0,
    zoom: DESKTOP_CANVAS_DEFAULT_ZOOM,
  });
  const [desktopCanvasPanReady, setDesktopCanvasPanReady] = useState(false);
  const [desktopCanvasPanActive, setDesktopCanvasPanActive] = useState(false);
  const [desktopZoomMenuOpen, setDesktopZoomMenuOpen] = useState(false);

  const viewportContainerRef = useRef(null);
  const desktopCanvasPanStateRef = useRef({
    pointerId: null,
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0,
  });

  // Sync viewportRef.current with viewport state
  useEffect(() => {
    viewportRef.current = viewport;
  }, [viewport]);

  // Zoom menu outside click / Escape close effect
  useEffect(() => {
    if (!desktopZoomMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!(event.target instanceof HTMLElement)) return;
      if (event.target.closest('.desktop-canvas-zoom-toolbar')) return;
      setDesktopZoomMenuOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setDesktopZoomMenuOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [desktopZoomMenuOpen]);

  // Clamp panX/panY so the canvas content is always at least 128px inside the viewport
  const clampViewportPan = useCallback((vp) => {
    const container = viewportContainerRef.current;
    if (!container) return vp;
    const MIN_VISIBLE = 128;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const contentW = DESKTOP_MAIN_CONTENT_MAX_WIDTH;

    const minPanX = MIN_VISIBLE - contentW;
    const maxPanX = cw - MIN_VISIBLE;
    const minPanY = -(ch * 4);
    const maxPanY = ch - MIN_VISIBLE;

    return {
      panX: Math.min(maxPanX, Math.max(minPanX, vp.panX)),
      panY: Math.min(maxPanY, Math.max(minPanY, vp.panY)),
      zoom: vp.zoom,
    };
  }, []);

  const fitDesktopCanvas = useCallback(() => {
    const container = viewportContainerRef.current;
    if (!container) return;
    const vw = container.clientWidth;
    const zoom = clampDesktopCanvasScale(
      Math.min(vw / DESKTOP_MAIN_CONTENT_MAX_WIDTH, DESKTOP_CANVAS_DEFAULT_ZOOM)
    );
    const contentW = DESKTOP_MAIN_CONTENT_MAX_WIDTH;
    const nextPanX = vw > contentW ? (vw - contentW) / 2 : 0;
    const nextVp = { panX: nextPanX, panY: 0, zoom };
    viewportRef.current = nextVp;
    setViewport(nextVp);
  }, []);

  // Initial fit canvas effect on mount
  useEffect(() => {
    let isMounted = true;
    const attemptFit = () => {
      if (!isMounted) return;
      if (viewportContainerRef.current && viewportContainerRef.current.clientWidth > 0) {
        if (viewportRef.current.panX === 0 && viewportRef.current.panY === 0) {
          fitDesktopCanvas();
        }
      } else {
        setTimeout(attemptFit, 50);
      }
    };
    attemptFit();
    return () => {
      isMounted = false;
    };
  }, [fitDesktopCanvas]);

  const getCanvasPointFromClient = useCallback((clientX, clientY) => {
    const container = viewportContainerRef.current;
    if (!container) return null;
    const rect = container.getBoundingClientRect();
    const appScale = viewportRef.current.zoom || DESKTOP_APP_WINDOW_SCALE;
    return screenToCanvas(
      (clientX - rect.left) / appScale,
      (clientY - rect.top) / appScale,
      viewportRef.current
    );
  }, []);

  const getDragCanvasPointFromClient = useCallback(
    (clientX, clientY) => {
      const rect = desktopDragContainerRectRef.current;
      if (rect) {
        const appScale = viewportRef.current.zoom || DESKTOP_APP_WINDOW_SCALE;
        return screenToCanvas(
          (clientX - rect.left) / appScale,
          (clientY - rect.top) / appScale,
          viewportRef.current
        );
      }
      return getCanvasPointFromClient(clientX, clientY);
    },
    [desktopDragContainerRectRef, getCanvasPointFromClient]
  );

  const updateDesktopCanvasZoomAnchored = useCallback(
    (nextZoom, anchor) => {
      const current = viewportRef.current;
      const clampedZoom = clampDesktopCanvasScale(Number(nextZoom.toFixed(3)));
      if (Math.abs(clampedZoom - current.zoom) < 0.001) return;

      const nextVp = clampViewportPan({ ...current, zoom: clampedZoom });
      viewportRef.current = nextVp;
      setViewport(nextVp);
    },
    [clampViewportPan]
  );

  const updateDesktopCanvasZoom = useCallback(
    (nextZoom) => {
      const container = viewportContainerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      updateDesktopCanvasZoomAnchored(nextZoom, {
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
      });
    },
    [updateDesktopCanvasZoomAnchored]
  );

  const handleDesktopCanvasWheel = useCallback(
    (event) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      event.preventDefault();
      const direction = event.deltaY > 0 ? -1 : 1;
      updateDesktopCanvasZoomAnchored(
        viewportRef.current.zoom + direction * DESKTOP_CANVAS_SCALE_STEP,
        { clientX: event.clientX, clientY: event.clientY }
      );
    },
    [updateDesktopCanvasZoomAnchored]
  );

  const handleDesktopZoomPresetSelect = useCallback(
    (preset) => {
      if (preset === 'in') {
        updateDesktopCanvasZoom(viewportRef.current.zoom + DESKTOP_CANVAS_SCALE_STEP);
      } else if (preset === 'out') {
        updateDesktopCanvasZoom(viewportRef.current.zoom - DESKTOP_CANVAS_SCALE_STEP);
      } else if (preset === 'fit') {
        fitDesktopCanvas();
      } else if (typeof preset === 'number') {
        updateDesktopCanvasZoom(preset);
      }
      setDesktopZoomMenuOpen(false);
    },
    [fitDesktopCanvas, updateDesktopCanvasZoom]
  );

  return {
    viewport,
    setViewport,
    viewportRef,
    viewportContainerRef,
    desktopCanvasPanReady,
    setDesktopCanvasPanReady,
    desktopCanvasPanActive,
    setDesktopCanvasPanActive,
    desktopCanvasPanStateRef,
    desktopZoomMenuOpen,
    setDesktopZoomMenuOpen,

    fitDesktopCanvas,
    getCanvasPointFromClient,
    getDragCanvasPointFromClient,
    clampViewportPan,
    updateDesktopCanvasZoom,
    updateDesktopCanvasZoomAnchored,
    handleDesktopCanvasWheel,
    handleDesktopZoomPresetSelect,
  };
};
