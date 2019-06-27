function rand(min, max) {
  return Math.floor(Math.random() * (max + 1 - min)) + min;
}

function get10(value) {
  return Math.floor(value / 10);
}

function sort(a, b) {
  return numberOrZero(b.value) - numberOrZero(a.value);
}

function numberOrZero(num) {
  const int = parseInt(num);
  return Number.isNaN(int) ? 0 : int;
}

/* eslint-disable-next-line no-unused-vars */
class BarChartRace {
  constructor(container, data) {
    if (!container || !data) throw new Error('Container and data required');

    const containerRect = container.getBoundingClientRect();
    const { width, height } = containerRect;
    this.canvasWidth = width;
    this.canvasHeight = height;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    container.appendChild(canvas);

    this.ctx = canvas.getContext('2d');
    this.container = container;
    this.data = data;
    this.gutter = 10;
    this.maxCount = 10;

    const maxCount = Math.min(this.maxCount, data[0].entries.length );
    this.colors = {};
    this.colorDict = {};
    this.barHeight = this.canvasHeight / (maxCount) - this.gutter;

    this.pos = -1;
    this.tickPos = 0;
  }

  _getRandomColor(minValue = 0, maxValue = 255) {
    let result = null;

    let found = false;

    const invert = (r, g, b) => (r + g + b) > maxValue * 3 / 2 ? `rgb(${minValue},${minValue},${minValue})` : `rgb(${maxValue},${maxValue},${maxValue})`;

    while (!found) {
      let r = rand(minValue, maxValue);
      let g = rand(minValue, maxValue);
      let b = rand(minValue, maxValue);

      const key = `${get10(r)}-${get10(g)}-${get10(b)}`;
      if (!this.colorDict[key]) {
        this.colorDict[key] = true;
        result = { value: `rgb(${r},${g},${b})`, inverted: invert(r,g,b) };
        found = true;
      }
    }

    return result;
  }

  _clear() {
    const { ctx, canvasHeight, canvasWidth } = this;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  _drawBar(name, value, idx, maxValue, color) {
    const width = value / maxValue * this.canvasWidth;

    const leadingSiblingValue = idx > 0 ? this.sorted[idx - 1].value : value * 2;

    const normY = idx * (this.barHeight + this.gutter); // 10 + 90 = 100
    const siblingNormY = (idx - 1) * (this.barHeight + this.gutter); // 0

    const diff = value / leadingSiblingValue;

    // diff = 1   | normY = siblingNormY + 0 bars
    // diff = 0.9 | normY = siblingNormY + (1 - (diff - THRESHOLD) / (1 - THRESHOLD)) * 1 bar
    // diff = 0.75| normY = siblingNormY + 1 bar

    const THRESHOLD = 0.9;

    const positionalY = siblingNormY + (1  - (diff - THRESHOLD) / (1 - THRESHOLD)) * (this.barHeight + this.gutter);

    const y = diff > THRESHOLD ? positionalY : normY;

    let _color = color || this.colors[name];
    if (!_color) {
      _color = this._getRandomColor();
      this.colors[name] = _color;
    }

    this.ctx.fillStyle = _color.value;
    // this.ctx.fillRect(0, , width, this.barHeight);
    this.ctx.fillRect(0, y, width, this.barHeight);

    this.ctx.fillStyle = _color.inverted;
    const formattedValue = Math.floor(value / 1000000);

    this.ctx.font = '10px Arial';
    this.ctx.fillText(`${name} (${formattedValue}M)`, 10, y + this.barHeight / 2 + 5);
  }

  _draw() {
    this._clear();

    this.ctx.font = '80px Arial';
    this.ctx.fillStyle = 'grey';
    this.ctx.fillText(this.data[this.pos].year, this.canvasWidth - 200, this.canvasHeight - 20);

    const maxValue = this.sorted[0].value;
    const firstN = this.sorted.slice(0, this.maxCount);

    const drawFunction = ({ name, value }, idx) => this._drawBar(name, value, idx, maxValue);
    firstN.forEach(drawFunction);
  }

  _tick() {
    const { data, tickPos } = this;
    let { pos } = this;

    if (tickPos > 0 && tickPos < 1000) {
      this.sorted.forEach((item, idx) => {
        item.value += this.tempo[idx];
      });
      this.tickPos += 16;
      this._draw();
      // console.warn('TICK', this.sorted.slice(1, 2).map(item => item.value))
    } else {
      // console.warn('BIG TICK');
      pos += 1;
      this.pos = pos;
      const data0 = data[pos];
      const data1 = data[pos + 1];

      if (!data1) {
        clearInterval(this.timer);
        this._draw();

        return ;
      }

      const data1Dict = data1.entries.reduce((acc, next) => {
        acc[next.name] = next.value;
        return acc;
      }, {});
      // console.warn(this.tempo.slice(0, this.maxCount))
      // console.warn(this.tempo)

      this.sorted = [...data0.entries].sort(sort);
      this.sorted.shift();
      this.diff = this.sorted.map(item => {
        const oldValue = numberOrZero(item.value);
        const newValue = numberOrZero(data1Dict[item.name]);

        return newValue - oldValue;
      });
      this.tempo = this.diff.map(item => item / (1000 / 16));

      // TODO: draw

      // const maxValue0 = sorted0[0].value;
      // const firstN = sorted0.slice(0, this.maxCount)

      this.tickPos = 1;
      // console.warn('BIG TICK', this.sorted.slice(1, 2).map(item => item.value), this.diff[1])
    }
  }

  start() {
    this.timer = setInterval(this._tick.bind(this), 16);
  }
}