export class Timer {
    private _time: number;
    public start() {
        this._time = Date.now();
    }
    public lap() {
        const res = this.time();
        this.start();
        return res;
    }
    public time() {
        return Date.now() - this._time;
    }
}