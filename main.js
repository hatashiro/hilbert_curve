import {LitElement, css, html} from 'https://unpkg.com/lit@2.2.5/index.js?module';

class HilbertApp extends LitElement {
  static styles = css`
    :host {
      color: blue;
    }
  `;

  static properties = {
    name: {type: String},
  };

  constructor() {
    super();

    this.name = 'Hilbert';
  }

  render() {
    return html`<p>Hello, ${this.name}!`;
  }
}

customElements.define('hilbert-app', HilbertApp);
