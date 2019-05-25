import { performance } from "perf_hooks";

export class Timer {
    private _time: number;
    public lap() {
        const res = this.time();
        this._time += res;
        return res;
    }
    public start() {
        this._time = performance.now();
    }
    public time() {
        return performance.now() - this._time;
    }
}
