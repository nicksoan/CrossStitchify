const symbols = 'ABCDEFGHIJKLMNOPQRSTUVWX';

export function createPattern(rgba, width, height, maxColors) {
  if (![width, height].every(n => Number.isInteger(n) && n >= 1 && n <= 120)
      || !Number.isInteger(maxColors) || maxColors < 2 || maxColors > 24
      || rgba.length !== width * height * 4) {
    throw new Error('Invalid grid dimensions, color limit, or pixel data.');
  }
  const pixels = [];
  for (let i = 0; i < rgba.length; i += 4) {
    const alpha = rgba[i + 3] / 255;
    pixels.push([0, 1, 2].map(c => Math.round(rgba[i + c] * alpha + 255 * (1 - alpha))));
  }
  const boxes = [pixels.slice()];
  const range = box => [0, 1, 2].map(c => {
    let low = 255, high = 0;
    for (const pixel of box) {
      low = Math.min(low, pixel[c]);
      high = Math.max(high, pixel[c]);
    }
    return high - low;
  });
  while (boxes.length < maxColors) {
    let best = -1, spread = 0, channel = 0;
    boxes.forEach((box, i) => {
      range(box).forEach((value, c) => {
        if (value > spread) { best = i; spread = value; channel = c; }
      });
    });
    if (best === -1) break;
    const box = boxes.splice(best, 1)[0].sort((a, b) => a[channel] - b[channel]);
    const middle = Math.floor(box.length / 2);
    boxes.push(box.slice(0, middle), box.slice(middle));
  }
  const averages = boxes.map(box => [0, 1, 2].map(c =>
    Math.round(box.reduce((sum, pixel) => sum + pixel[c], 0) / box.length)));
  const palette = [...new Map(averages.map(rgb => [rgb.join(','), rgb])).values()];
  const cells = pixels.map(pixel => {
    let nearest = 0, distance = Infinity;
    palette.forEach((rgb, i) => {
      const d = rgb.reduce((sum, value, c) => sum + (value - pixel[c]) ** 2, 0);
      if (d < distance) { nearest = i; distance = d; }
    });
    return nearest;
  });
  const counts = new Array(palette.length).fill(0);
  cells.forEach(i => counts[i]++);
  const used = palette.map((rgb, i) => ({
    rgb, hex: '#' + rgb.map(c => c.toString(16).padStart(2, '0')).join(''), count: counts[i], index: i
  })).filter(color => color.count > 0);
  const remap = new Map(used.map((color, i) => [color.index, i]));
  return {
    width, height,
    colors: used.map((color, i) => ({ ...color, symbol: symbols[i] })),
    cells: cells.map(i => remap.get(i))
  };
}

export function patternInstructions(pattern) {
  const { width, height, colors, cells } = pattern;
  const lines = [
    'CrossStitchify pattern',
    `${width} × ${height} stitches; ${cells.length} full cross stitches; ${colors.length} colors.`,
    `On 14-count Aida: ${(width / 14).toFixed(2)} × ${(height / 14).toFixed(2)} inches, excluding framing margins.`,
    '',
    'Match the approximate HEX colors below to embroidery floss (not manufacturer thread codes).',
    ...colors.map(c => `${c.symbol}: ${c.hex} — ${c.count} stitches`),
    '',
    'Leave extra fabric on all sides. Align the chart center with the fabric center.',
    'Use two strands on 14-count Aida. Each square is one X; keep top diagonals consistent.',
    'Secure thread ends on the back. White squares are stitches too.',
    'Rows count top to bottom; columns count left to right, starting at 1.',
    ''
  ];
  for (let row = 0; row < height; row++) {
    const runs = [];
    for (let column = 0; column < width;) {
      const start = column, color = cells[row * width + column];
      while (column < width && cells[row * width + column] === color) column++;
      const location = column === start + 1 ? `${start + 1}` : `${start + 1}–${column}`;
      runs.push(`column${column === start + 1 ? '' : 's'} ${location}: ${colors[color].symbol} (${column - start} stitch${column === start + 1 ? '' : 'es'})`);
    }
    lines.push(`Row ${row + 1}: ${runs.join('; ')}.`);
  }
  return lines.join('\n');
}
