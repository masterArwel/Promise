const PENDING = 'pending';
const REJECTED = 'rejected';
const RESERVED = 'reserved';

class myPromise {
  constructor(ctx) {
    this.status = 'pending';
    this.value = null;
    this.reason = null;
    const reserveCbs = [];
    const rejectCbs = [];
    function reserve(value) {
      if (this.status !== PENDING) return;
      this.status = 'reserved';
      this.value = value;
      reserveCbs.map(fn => fn(value))
    }
    function reject(reason) {
      if (this.status !== PENDING) return;
      this.status = 'rejected';
      this.reason = reason;
      rejectCbs.map(fn => fn(reason))
    }
    ctx(reserve.bind(this),reject.bind(this));
  }
  then(reserve, reject) {
    reserve = typeof reserve === 'function' ? reserve : v => { return v };
    reject = typeof reject === 'function' ? reject : e => { throw e; };
    function resolvePromise (promise2, x, resolve, reject) {
      if (promise2 === x) {
        // 不允许 promise2 === x; 避免自己等待自己
        return reject(new TypeError('Chaining cycle detected for promise'));
      }
      // 防止重复调用
      let called = false;
      try {
        if (x instanceof Promise) {
          let then = x.then;
          then.call(x, y => {
            if (called) return;
            called = true;
            resolvePromise(promise2, y, resolve, reject);
          }, err => {
            if (called) return;
            called = true;
            reject(err);
          });
        } else {
          resolve(x);
        }
      } catch (e) {
        reject(e);
      }
    }
    let promise2 = new Promise((resolve, reject) => {
      function fulfilled () {
        setTimeout(() => {
          let x = onFulfilled(this.value);
          resolvePromise(promise2, x, resolve, reject);
        }, 0);
      };
  
      function rejected () {
        setTimeout(() => {
          let x = onRejected(this.reason);
          resolvePromise(promise2, x, resolve, reject);
        }, 0);
      }
  
      if (this.status === RESOLVED) {
        fulfilled.call(this);
      }
  
      if (this.status === REJECTED) {
        rejected.call(this);
      }
  
      if (this.status === PENDING) {
        this.resolveCbs.push(fulfilled.bind(this));
        this.rejectCbs.push(rejected.bind(this));
      }
    });
    return promise2;
  }
  catch(fn) {
    this.then(null, fn);
  }
  static resolve (val) {
    return new Promise((resolve) => {
      resolve(val);
    });
  }
  static reject (val) {
    return new Promise((resolve, reject) => {
      reject(val);
    });
  }
  static race(promises) {
    return new Promise((resolve, reject) => {
      promises.map(promise => {
        promise.then(resolve, reject);
      });
    });
  }
  static all(promises) {
    let arr = [];
    let i = 0;
    return new Promise((resolve, reject) => {
      promises.map((promise, index) => {
        promise.then(data => {
          arr[index] = data;
          if (++i === promises.length) {
            resolve(arr);
          }
        }, reject);
      })
    })
  }
}