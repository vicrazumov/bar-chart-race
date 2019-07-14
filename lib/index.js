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

const ICON_SIZE = 32;
const RIGHT_FIELD_MARGIN = 0.2;
const HEADER_SIZE = 40;

// assuming performance of 60 FPS, 60 FRAMES_PER_PERIOD equals to 1 sec per period
// TODO: adjust pace to actual FPS
const FRAMES_PER_PERIOD = 60;

/* eslint-disable-next-line no-unused-vars */
class BarChartRace {
  constructor(container, data) {
    if (!container || !data) throw new Error('Container and data required');

    this.container = container;

    // TODO: allow config
    this.hasIcons = false;
    this.showRulers = false;

    this.canvas = document.createElement('canvas');
    container.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d');
    this.container = container;
    this.data = data;
    this.gutter = 10;
    this.maxCount = Math.min(10, data[0].entries.length);

    this.colors = {};
    this.colorDict = {};

    this.pos = -1;
    this.currentFrame = 0;

    this.resize();
  }

  resize() {
    const containerRect = this.container.getBoundingClientRect();
    const { width, height } = containerRect;

    this.canvasWidth = width;
    this.canvasHeight = height;
    this.fieldWidth = this.hasIcons ? this.canvasWidth - ICON_SIZE : this.canvasWidth;
    this.fieldHeight = this.showRulers ? this.canvasHeight - HEADER_SIZE : this.canvasHeight;

    this.canvas.width = width;
    this.canvas.height = height;

    this.barHeight = this.fieldHeight / (this.maxCount) - this.gutter;
    this.barFontSize = this.barHeight / 3;
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
    const width = value / maxValue * this.fieldWidth * (1 - RIGHT_FIELD_MARGIN);

    const leadingSiblingValue = idx > 0 ? this.sorted[idx - 1].value : value * 2;

    const headerSize = this.showRulers ? HEADER_SIZE : 0;
    const normY = headerSize + idx * (this.barHeight + this.gutter);
    const siblingNormY = headerSize + (idx - 1) * (this.barHeight + this.gutter);

    // when a bar reaches 90% (THRESHOLD) of its top sibling,
    // it starts "moving" towards it
    const diff = value / leadingSiblingValue;

    // diff = 1   | normY = siblingNormY + 0 bars
    // diff = 0.9 | normY = siblingNormY + (1 - (diff - THRESHOLD) / (1 - THRESHOLD)) * 1 bar
    // diff = THRESHOLD| normY = siblingNormY + 1 bar

    const THRESHOLD = 0.9;

    const positionalY = siblingNormY + (1  - (diff - THRESHOLD) / (1 - THRESHOLD)) * (this.barHeight + this.gutter);

    const y = diff > THRESHOLD ? positionalY : normY;

    let _color = color || this.colors[name];
    if (!_color) {
      _color = this._getRandomColor();
      this.colors[name] = _color;
    }

    this.ctx.fillStyle = _color.value;
    this.ctx.fillRect(0, y, width, this.barHeight);

    this.ctx.fillStyle = _color.inverted;
    // TODO: add value formatting

    this.ctx.font = `${this.barFontSize}px Arial`;
    this.ctx.fillText(name.slice(0, (width - 20) / this.barFontSize * 2), 10, y + this.barHeight / 2 + 5);
    this.ctx.fillStyle = 'black';
    this.ctx.fillText(Math.trunc(value), width + 5, y + this.barHeight / 2 + 5);
  }

  // _drawRulers(maxValue) {
  //   this.steps.forEach(step => {
  //     const x = step / maxValue * this.fieldWidth * (1 - RIGHT_FIELD_MARGIN);
  //     this.ctx.fillStyle = 'silver';
  //     this.ctx.fillRect(x, 0, 1, HEADER_SIZE);

  //     this.ctx.fillStyle = 'silver';
  //     this.ctx.fillRect(x, HEADER_SIZE, 1, this.fieldHeight);

  //     const formattedValue = Math.floor(step / 1000000);

  //     this.ctx.font = this.barFont;
  //     this.ctx.fillText(`${formattedValue}M`, x + 5, 20);
  //   });
  // }

  _drawDateLabel() {
    // TODO: customize
    const dateLabelFontSize = this.fieldHeight / 10;
    const xOffset = dateLabelFontSize * 2.5;
    const yOffSet = dateLabelFontSize * 0.25;

    this.ctx.font = `${dateLabelFontSize}px Arial`;
    this.ctx.fillStyle = 'grey';
    this.ctx.fillText(this.data[this.pos].year, this.fieldWidth - xOffset, this.canvasHeight - yOffSet);
  }

  _draw() {
    this._clear();

    const maxValue = this.sorted[0].value;
    const firstN = this.sorted.slice(0, this.maxCount);

    // TODO: refactor rulers

    // if (this.steps) {
    //   const lastStep = this.steps[this.steps.length - 1];
    //   const oneStepBeforeLast = this.steps[this.steps.length - 2];
    //   const prevDiff = lastStep - oneStepBeforeLast;

    //   if (lastStep + prevDiff <= maxValue * 0.9) {
    //     const rulerStep = lastStep + prevDiff;
    //     // this.steps = this.steps.slice(1, this.steps.length);
    //     this.steps.push(rulerStep);
    //   }
    // } else {
    //   const rulerStep = Math.floor(maxValue * 0.9 / 4);
    //   const min = Math.floor(maxValue * 0.15);
    //   this.steps = [min, min + rulerStep * 1.5, min + rulerStep * 3];
    // }

    // this._drawRulers(maxValue);

    this._drawDateLabel();

    const drawFunction = ({ name, value }, idx) => this._drawBar(name, value, idx, maxValue);
    firstN.forEach(drawFunction);
  }

  _tick() {
    if (this.currentFrame > 0 && this.currentFrame < FRAMES_PER_PERIOD) {
      this.sorted.forEach((item, idx) => {
        item.value += this.tempo[idx];
      });
      this.currentFrame += 1;
      this._draw();

      requestAnimationFrame(this._tick.bind(this));
    } else {
      this.pos += 1;
      const data0 = this.data[this.pos];
      const data1 = this.data[this.pos + 1];

      if (!data1) {
        this._draw();

        return ;
      }

      const data1Dict = data1.entries.reduce((acc, next) => {
        acc[next.name] = next.value;
        return acc;
      }, {});

      this.sorted = [...data0.entries].sort(sort);

      this.diff = this.sorted.map(item => {
        const oldValue = numberOrZero(item.value);
        const newValue = numberOrZero(data1Dict[item.name]);

        return newValue - oldValue;
      });
      this.tempo = this.diff.map(item => item / FRAMES_PER_PERIOD);

      this.currentFrame = 1;

      requestAnimationFrame(this._tick.bind(this));
    }
  }

  start() {
    requestAnimationFrame(this._tick.bind(this));
  }
}