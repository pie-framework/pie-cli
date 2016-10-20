import Vue from 'vue';
import Component from './component.vue';

export default class CorespringMultipleChoiceVueElement extends HTMLElement {
  constructor() {
    super();
    this._model = null;
    this._session = null;
  }

  get model() {
    return this._model;
  }

  set model(s) {
    this._model = s;
    this._rerender();
  }

  get session() {
    return this._session;
  }

  set session(s) {
    this._session = s;
    this._rerender();
  }

  connectedCallback() {
    console.log('connected');
    this.dispatchEvent(new CustomEvent('pie.register', { bubbles: true }));
  }

  _rerender() {
    console.log('_rerender...');

    if (this._model) {
      new Vue({
        el: this,
        render: h => h(Component, { props: { msg: this._model.prompt } }),
      });
    }
  }
}