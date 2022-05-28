import {LitElement, css, html} from 'https://unpkg.com/lit@2.2.5/index.js?module';
import {classMap} from 'https://unpkg.com/lit@2.2.5/directives/class-map.js?module';

const LEVEL_RANGE_MAX = 5;

const DECIMAL_RANGE_STEP = 1e-10;
const DECIMAL_RANGE_MAX = 1 - DECIMAL_RANGE_STEP;

const BINARY_STRING_LEN = 14;  // len(mantissa) + 2, because "0.xxx..."

const DEFAULT_CELL_INDICES = [[1, 2],
                              [0, 3]];

class HilbertCurveApp extends LitElement {
  static styles = css`
    fieldset {
      margin: 0;
    }

    input[type="range"] {
      width: 100%;
    }

    .level-btn {
      border: 1px solid #444;
      border-radius: 3px;
      padding: 1px 3px;
    }

    .level-btn:hover {
      cursor: pointer;
      text-decoration: underline;
      background-color: #eee;
    }

    .level-btn.highlighted {
      background-color: #0075ff;
      color: white;
    }

    .hilbert-cell-container {
      position: relative;
      margin-top: 10px;
      padding-bottom: 100%;
      border: 1px solid #999;
    }
  `;

  static properties = {
    level: {type: Number},
    decimal: {type: Number},
    highlightedLevel: {type: Number},
  };

  constructor() {
    super();

    this.level = 3;
    this.decimal = Number(Math.random().toFixed(10));
    this.highlightedLevel = -1;
  }

  get binaryString() {
    if (this.decimal === 0) {
      return '0.' + '0'.repeat(BINARY_STRING_LEN - 2);
    }

    let binaryString = this.decimal.toString(2);
    if (binaryString.length > BINARY_STRING_LEN) {
      binaryString = binaryString.substring(0, BINARY_STRING_LEN) + '...';
    } else {
      binaryString += '0'.repeat(BINARY_STRING_LEN - binaryString.length);
    }
    return binaryString;
  }

  get mantissa() {
    return this.binaryString.substring(2);  // Always "0.xx..."
  }

  render() {
    return html`
      <fieldset>
        <legend>Hilbert Curve Function</legend>

        <label for="level">Level: <b>${this.level}</b></label>
        <input id="level" type="range"
            min="1" .max="${LEVEL_RANGE_MAX}" .value="${this.level}" 
            @input="${this.updateLevel}">

        <label for="decimal">Decimal Input: <b>${this.decimal}</b></label>
        <input id="decimal" type="range"
            min="0" .max="${DECIMAL_RANGE_MAX}" .step="${DECIMAL_RANGE_STEP}"
            .value="${this.decimal}"
            @input="${this.updateDecimal}">

        <label for="binary">Binary Input: <b>${this.binaryString}</b></label>
      </fieldset>

      <fieldset>
        <legend>Explanation</legend>
        <div>${this.renderExplanation()}</div>
      </fieldset>

      <div class="hilbert-cell-container">
        <hilbert-curve-cell
            .level=${0} .maxLevel=${this.level}
            .highlightedLevel=${this.highlightedLevel}
            .current=${true}
            .mantissa=${this.mantissa}
            .cellIndices=${DEFAULT_CELL_INDICES} />
      </div>
    `;
  }

  updateLevel(evt) {
    this.level = parseInt(evt.target.value, 10);
    if (this.level < this.highlightedLevel) {
      this.highlightedLevel = -1;
    }
  }

  updateDecimal(evt) {
    this.decimal = parseFloat(evt.target.value);
    this.highlightedLevel = -1;
  }

  renderExplanation() {
    const buttons = [];
    for (let i = 0; i < this.level; i++) {
      const binaryIdx = this.mantissa.substring(2 * i, 2 * (i + 1));

      const level = i + 1;
      const highlighted = level == this.highlightedLevel;
      const classes = {highlighted};
      const toggleHighlight = () => {
        this.highlightedLevel = highlighted ? -1 : level;
      };

      buttons.push(html`
        <span
            class="level-btn ${classMap(classes)}"
            @click="${toggleHighlight}">${binaryIdx}</span>
      `);
    }
    return html`0.${buttons}${this.mantissa.substring(2 * this.level)}`;
  }
}

customElements.define('hilbert-curve-app', HilbertCurveApp);

class HilbertCurveCell extends LitElement {
  static styles = css`
    :host {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border-right: 1px solid #999;
      border-bottom: 1px solid #999;
    }

    :host:last-child {
      border: none;
    }

    .hilbert-curve-cell {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .hilbert-curve-cell.highlighted {
      background-color: rgba(255, 0, 0, 0.3);
    }

    .hilbert-curve-cell.highlighted-background {
      background-color: rgba(255, 0, 0, 0.1);
    }

    .hilbert-curve-cell.target {
      background-color: red;
    }

    .hilbert-curve-row {
      flex: 1;
      display: flex;
      flex-direction: row;
    }

    .hilbert-curve-col {
      flex: 1;
      position: relative;
    }
  `;

  static properties = {
    level: {type: Number},
    maxLevel: {type: Number},
    highlightedLevel: {type: Number},
    current: {type: Boolean},
    mantissa: {type: String},
    cellIndices: {type: Array},
  };

  constructor(...args) {
    super();

    this.level = 0;
    this.maxLevel = 0;
    this.highlightedLevel = -1;
    this.mantissa = '';
    this.cellIndices = [];
  }

  render() {
    const contents = [];
    const classes = {
      'target': false,
      'highlighted':
          this.current && this.level === this.highlightedLevel,
      'highlighted-background':
          this.current && this.level === this.highlightedLevel - 1,
    };
    if (this.level < this.maxLevel) {
      for (let row = 0; row < 2; row++) {
        const columns = [];
        for (let col = 0; col < 2; col++) {
          let nextCurrent = false;
          let nextMantissa = '';
          let nextCellIndices = [];

          if (this.current) {
            const binaryCellIdx = this.mantissa.substring(0, 2);
            const cellIdx = parseInt(binaryCellIdx, 2);

            nextCurrent = this.cellIndices[row][col] == cellIdx;
            if (nextCurrent) {
              nextCellIndices = this.rotateIndices(this.cellIndices, cellIdx);
              nextMantissa = this.mantissa.substring(2);
            }
          }

          columns.push(html`
            <div class="hilbert-curve-col">
              <hilbert-curve-cell
                  .level=${this.level + 1} .maxLevel=${this.maxLevel}
                  .highlightedLevel=${this.highlightedLevel}
                  .current=${nextCurrent}
                  .mantissa=${nextMantissa}
                  .cellIndices=${nextCellIndices} />
            </div>
          `)
        }
        contents.push(html`<div class="hilbert-curve-row">${columns}</div>`)
      }
    } else {
      classes.target = this.current;
    }
    return html`
      <div class="hilbert-curve-cell ${classMap(classes)}">
        ${contents}
      </div>
    `;
  }


  rotateIndices(cellIndices, currentCellIdx) {
    if (currentCellIdx === 1 || currentCellIdx === 2) {
      return cellIndices;
    }

    if (currentCellIdx === 0) {
      return [[cellIndices[1][1], cellIndices[0][1]],
              [cellIndices[1][0], cellIndices[0][0]]];
    } else {  // 3
      return [[cellIndices[0][0], cellIndices[1][0]],
              [cellIndices[0][1], cellIndices[1][1]]];
    }
  }
}

customElements.define('hilbert-curve-cell', HilbertCurveCell);
