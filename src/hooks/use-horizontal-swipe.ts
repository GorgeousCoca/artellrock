"use client";

import { useCallback, useRef, type TouchEvent } from "react";

const DEFAULT_THRESHOLD = 48;
const AXIS_RATIO = 1.25;

type SwipeHandlers = {
  onTouchStart: (event: TouchEvent) => void;
  onTouchEnd: (event: TouchEvent) => void;
  onTouchCancel: () => void;
};

export function useHorizontalSwipe(
  onSwipeLeft: () => void,
  onSwipeRight: () => void,
  threshold = DEFAULT_THRESHOLD
): SwipeHandlers {
  const startRef = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = useCallback((event: TouchEvent) => {
    if (event.touches.length !== 1) {
      return;
    }
    const touch = event.touches[0];
    startRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const onTouchEnd = useCallback(
    (event: TouchEvent) => {
      const start = startRef.current;
      startRef.current = null;
      if (!start) {
        return;
      }

      const touch = event.changedTouches[0];
      if (!touch) {
        return;
      }

      const deltaX = touch.clientX - start.x;
      const deltaY = touch.clientY - start.y;

      if (Math.abs(deltaX) < threshold) {
        return;
      }
      if (Math.abs(deltaX) < Math.abs(deltaY) * AXIS_RATIO) {
        return;
      }

      if (deltaX < 0) {
        onSwipeLeft();
        return;
      }
      onSwipeRight();
    },
    [onSwipeLeft, onSwipeRight, threshold]
  );

  const onTouchCancel = useCallback(() => {
    startRef.current = null;
  }, []);

  return { onTouchStart, onTouchEnd, onTouchCancel };
}
