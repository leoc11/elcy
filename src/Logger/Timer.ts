import { performance } from "perf_hooks";

export class Timer {
    private _time: number;
    public start() {
        this._time = performance.now();
    }
    public lap() {
        const res = this.time();
        this._time += res;
        return res;
    }
    public time() {
        return performance.now() - this._time;
    }
}
