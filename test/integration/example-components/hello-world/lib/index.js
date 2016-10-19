import React from 'react';
import ReactDOM from 'react-dom';
import Tester from './tester';

export default class HelloWorld extends HTMLElement {

  connectedCallback() {
    console.log('attached..');
    this.dispatchEvent(new CustomEvent('pie.register', { bubbles: true }));
  }

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
      let el = React.createElement(Tester, { msg: this._model.value });
      ReactDOM.render(el, this);
    }
  }
}
