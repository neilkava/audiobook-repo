class EventBus {
  constructor() {
    this._listeners = {};
  }

  on(event, fn) {
    (this._listeners[event] ??= []).push(fn);
    return () => this.off(event, fn);
  }

  off(event, fn) {
    const fns = this._listeners[event];
    if (fns) this._listeners[event] = fns.filter(f => f !== fn);
  }

  emit(event, data) {
    const fns = this._listeners[event];
    if (fns) fns.forEach(fn => fn(data));
  }
}

export const bus = new EventBus();
