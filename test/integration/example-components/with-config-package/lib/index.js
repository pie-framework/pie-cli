require('./index.less');

export default class HelloWorld extends HTMLElement {

  set model(m) {
    this._model = m;
    this._render();
  }

  set session(s) {
    this._session = s;
    this._render();
  }

  _render() {
    if (this._model && this._session) {
      this.innerHTML = JSON.stringify({ model: this._model, session: this._session });
    }
  }
}
