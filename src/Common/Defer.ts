export class Defer<T> extends Promise<T> {
    constructor() {
        let _resolve: (value?: T | PromiseLike<T>) => void;
        let _reject: (reason?: any) => void;
        super((resolve, reject) => {
            _resolve = resolve;
            _reject = reject;
        });
        this.resolve = _resolve;
        this.reject = _reject;
    }
    public resolve: (value?: T | PromiseLike<T>) => void;
    public reject: (reason?: any) => void;
}
Defer.prototype.constructor = Promise;
