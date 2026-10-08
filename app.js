import { createPattern, patternInstructions } from './pattern.js';

const form = document.querySelector('#pattern-form');
const fileInput = document.querySelector('#image');
const status = document.querySelector('#status');
const result = document.querySelector('#result');
const chart = document.querySelector('#chart');
const generate = document.querySelector('#generate');
let instructions = '';
let revision = 0;

form.addEventListener('input', () => {
  revision++;
  result.hidden = true;
  status.textContent = '';
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  const current = ++revision;
  result.hidden = true;
  status.className = '';
  generate.disabled = true;
  status.textContent = 'Creating your pattern…';
  let url;
  try {
    const file = fileInput.files[0];
    if (!file || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      throw new Error('Please choose a PNG, JPEG, or WebP image.');
    }
    if (file.size > 10 * 1024 * 1024) throw new Error('Please choose an image smaller than 10 MB.');
    const width = Number(document.querySelector('#width').value);
    const height = Number(document.querySelector('#height').value);
    const maxColors = Number(document.querySelector('#colors').value);
    const image = new Image();
    url = URL.createObjectURL(file);
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error('This image could not be read. Please try another file.'));
      image.src = url;
    });
    if (current !== revision) return;
    if (image.naturalWidth * image.naturalHeight > 24_000_000) {
      throw new Error('Please resize this image to 24 megapixels or less.');
    }
    const sample = document.createElement('canvas');
    sample.width = width;
    sample.height = height;
    const ctx = sample.getContext('2d', { willReadFrequently: true });
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
    const fittedWidth = image.naturalWidth * scale, fittedHeight = image.naturalHeight * scale;
    ctx.drawImage(image, (width - fittedWidth) / 2, (height - fittedHeight) / 2, fittedWidth, fittedHeight);
    const pattern = createPattern(ctx.getImageData(0, 0, width, height).data, width, height, maxColors);
    instructions = patternInstructions(pattern);
    drawChart(pattern);
    document.querySelector('#summary').textContent =
      `${width} × ${height} stitches · ${width * height} total · ${pattern.colors.length} thread colors · ${(width / 14).toFixed(2)} × ${(height / 14).toFixed(2)} inches on 14-count Aida (plus margins)`;
    const legend = document.querySelector('#legend');
    legend.replaceChildren();
    for (const color of pattern.colors) {
      const item = document.createElement('li');
      const swatch = document.createElement('span');
      swatch.className = 'swatch';
      swatch.style.backgroundColor = color.hex;
      swatch.setAttribute('aria-hidden', 'true');
      item.append(swatch, `${color.symbol} · ${color.hex} · ${color.count} stitches`);
      legend.append(item);
    }
    document.querySelector('#instructions').textContent = instructions;
    result.hidden = false;
    status.textContent = 'Your pattern is ready.';
  } catch (error) {
    if (current !== revision) return;
    status.className = 'error';
    status.textContent = error.message;
  } finally {
    if (url) URL.revokeObjectURL(url);
    generate.disabled = false;
  }
});

function drawChart({ width, height, colors, cells }) {
  const size = 24, margin = 32;
  chart.width = width * size + margin;
  chart.height = height * size + margin;
  const ctx = chart.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, chart.width, chart.height);
  ctx.font = '12px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  cells.forEach((index, i) => {
    const x = margin + i % width * size, y = margin + Math.floor(i / width) * size;
    const color = colors[index];
    ctx.fillStyle = color.hex;
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = color.rgb.reduce((sum, c, j) => sum + c * [0.299, 0.587, 0.114][j], 0) > 145 ? '#000000' : '#ffffff';
    ctx.fillText(color.symbol, x + size / 2, y + size / 2);
  });
  ctx.fillStyle = '#000000';
  for (let column = 0; column < width; column++) {
    if (column === 0 || (column + 1) % 5 === 0) ctx.fillText(column + 1, margin + (column + .5) * size, margin / 2);
  }
  for (let row = 0; row < height; row++) {
    if (row === 0 || (row + 1) % 5 === 0) ctx.fillText(row + 1, margin / 2, margin + (row + .5) * size);
  }
  ctx.strokeStyle = '#000000';
  for (let column = 0; column <= width; column++) {
    ctx.lineWidth = column % 10 === 0 ? 1.5 : .3;
    ctx.beginPath();
    ctx.moveTo(margin + column * size, margin);
    ctx.lineTo(margin + column * size, chart.height);
    ctx.stroke();
  }
  for (let row = 0; row <= height; row++) {
    ctx.lineWidth = row % 10 === 0 ? 1.5 : .3;
    ctx.beginPath();
    ctx.moveTo(margin, margin + row * size);
    ctx.lineTo(chart.width, margin + row * size);
    ctx.stroke();
  }
}

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

document.querySelector('#download-instructions').addEventListener('click', () =>
  download(new Blob([instructions], { type: 'text/plain;charset=utf-8' }), 'crossstitch-instructions.txt'));
document.querySelector('#download-chart').addEventListener('click', () =>
  chart.toBlob(blob => {
    if (blob) download(blob, 'crossstitch-chart.png');
  }, 'image/png'));
