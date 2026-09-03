export type Point = { x: number; y: number };
export type Size = { width: number; height: number };

const EDGE_MARGIN = 8;

/**
 * Keeps a floating panel inside its container so a drag or a window resize
 * can never leave it unreachable. When the panel is larger than the container
 * it pins to the top-left instead of oscillating.
 */
export function clampPanelPosition(
  position: Point,
  panel: Size,
  container: Size,
): Point {
  const maxX = Math.max(
    EDGE_MARGIN,
    container.width - panel.width - EDGE_MARGIN,
  );
  const maxY = Math.max(
    EDGE_MARGIN,
    container.height - panel.height - EDGE_MARGIN,
  );
  return {
    x: Math.min(Math.max(EDGE_MARGIN, position.x), maxX),
    y: Math.min(Math.max(EDGE_MARGIN, position.y), maxY),
  };
}
