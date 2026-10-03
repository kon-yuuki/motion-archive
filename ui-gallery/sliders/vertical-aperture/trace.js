/**
 * Image-plane measurements from the 1600×1200 / 60fps official recording.
 * Page crop: (195,234)–(1405,965). Times are clip time, not input latency.
 * Columns: seconds, unwrapped film position, topY, bottomY, top-leftX,
 * bottom-leftX, midpoint bow from the linear side (negative = outward).
 * Seams measured from horizontal row discontinuities; fully covered moments
 * and 2.8s pale shot are visually estimated. Original easing remains unknown.
 */
export const TRACE = [
  [0, 1.358, 392, 769, 466, 464, -4],
  [.2, 1.709, 392, 770, 465, 463, -5],
  [.4, 2.985, 382, 770, 455, 451, -11],
  [.6, 3.785, 389, 770, 462, 460, -5],
  [.8, 4.134, 395, 768, 469, 468, -2.5],
  [1, 4.217, 399, 767, 473, 472, -.5],
  [1.2, 5.225, 384, 770, 457, 454, -8.5],
  [1.4, 6, 390, 770, 463, 461, -6],
  [1.6, 6.288, 396, 768, 469, 468, -2.5],
  [1.8, 5.766, 415, 761, 490, 491, 5.5],
  [2, 4.709, 417, 761, 492, 493, 6.5],
  [2.2, 4.051, 411, 763, 486, 487, 3.5],
  [2.4, 3.352, 419, 760, 494, 496, 8],
  [2.6, 1.911, 423, 759, 498, 499, 8.5],
  [2.8, .98, 416, 760, 491, 492, 6],
  [3, .589, 407, 765, 482, 482, 3],
  [3.2, -.457, 422, 759, 497, 499, 9],
  [3.4, -1.620, 418, 760, 493, 495, 7],
  [3.6, -2.276, 412, 763, 486, 487, 4.5],
  [3.8, -2.521, 406, 765, 480, 481, 2.5],
  [4, -2.730, 402, 767, 476, 477, 1],
];
export const TRACE_DURATION = 4000;
const slopes = TRACE.map((row, i) => row.map((_, column) => {
  if (!column) return 0;
  const before = i ? (row[column] - TRACE[i - 1][column]) / (row[0] - TRACE[i - 1][0]) : null;
  const after = i < TRACE.length - 1 ? (TRACE[i + 1][column] - row[column]) / (TRACE[i + 1][0] - row[0]) : null;
  if (before === null) return after;
  if (after === null) return before;
  return before * after <= 0 ? 0 : 2 * before * after / (before + after);
}));
/** Shape-preserving Hermite interpolation; a reconstruction, not source code. */
export function sampleTrace(milliseconds) {
  const t = Math.max(0, Math.min(4, milliseconds / 1000));
  const i = Math.min(TRACE.length - 2, Math.floor(t / .2));
  const a = TRACE[i], b = TRACE[i + 1], h = b[0] - a[0], u = (t - a[0]) / h;
  return a.slice(1).map((v, k) => {
    const c = k + 1;
    return (2 * u ** 3 - 3 * u ** 2 + 1) * v + (u ** 3 - 2 * u ** 2 + u) * h * slopes[i][c]
      + (-2 * u ** 3 + 3 * u ** 2) * b[c] + (u ** 3 - u ** 2) * h * slopes[i + 1][c];
  });
}
