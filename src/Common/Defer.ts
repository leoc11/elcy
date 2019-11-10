export class Defer<T> extends Promise<T> {
    constructor() {
        super((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }

    public resolve: (value?: T | PromiseLike<T>) => void;
    public reject: (reason?: any) => void;
}
