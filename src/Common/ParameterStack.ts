export class ParameterStack {
    private _data: Map<string, any[]> = new Map();
    public [Symbol.iterator]() {
        return this._data[Symbol.iterator]();
    }
    public clone() {
        const clone = new ParameterStack();
        clone.concat(this);
        return clone;
    }
    public concat(entries: Iterable<readonly [string, any[]]>) {
        for (const entry of entries) {
            const vals = this._data.get(entry[0]) || [];
            this._data.set(entry[0], vals.concat(entry[1]));
        }
    }
    public reduce() {
        const res: { [key: string]: any } = {};
        for (const entry of this) {
            res[entry[0]] = entry[1][entry[1].length - 1];
        }
        return res;
    }
    public get<T = any>(key: string, index?: number) {
        const vals = this._data.get(key);
        if (!vals) {
            return null;
        }

        if (typeof index !== "number") {
            index = vals.length - 1;
        }
        return vals[index] as T;
    }
    public getAll(key: string) {
        let items = this._data.get(key);
        items = items ? Array.from(items) : [];
        return items;
    }
    public push(key: string, value: any) {
        let vals = this._data.get(key);
        if (!vals) {
            vals = [];
            this._data.set(key, vals);
        }
        vals.push(value);
        return vals.length;
    }
    public set(param: { [key: string]: any }) {
        for (const prop in param) {
            this.push(prop, param[prop]);
        }
    }
    public pop(key: string) {
        const vals = this._data.get(key) || [];
        const res = [null, vals.length];
        if (vals.length > 0) {
            res[0] = vals.pop();
        }
        return res;
    }
    public clear() {
        this._data.clear();
    }
}

export interface INodeTree<T> {
    node: T;
    childrens: Array<INodeTree<T>>;
}
