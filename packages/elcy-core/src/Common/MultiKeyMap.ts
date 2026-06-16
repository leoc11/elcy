import { isNull } from "src/Helper/Util";
import { ObjectLike } from "./Type";

type PathMap<K, V> = Map<unknown, PathMap<K, V> | V>;
export class MultiKeyMap<K extends object, V> implements Iterable<V> {
    private root: PathMap<unknown, V>;
    private readonly _pathes: (keyof K)[];
    private readonly _valuePath: keyof K;

    constructor(properties: (keyof K)[]) {
        this.root = new Map();
        this._pathes = properties;
        this._valuePath = properties.pop();
    }

    public set(keys: ObjectLike<K>, value: V): this {
        if (isNull(keys)) {
            return this;
        }

        let current = this.root;

        for (const property of this._pathes) {
            const key = keys[property];
            let next = current.get(key) as PathMap<K, V>;
            if (!next) {
                next = new Map();
                current.set(key, next);
            }
            current = next;
        }

        current.set(keys[this._valuePath], value);
        return this;
    }

    public get(keys: ObjectLike<K>): V | undefined {
        if (isNull(keys)) {
            return undefined;
        }

        let current = this.root;
        for (const property of this._pathes) {
            const key = keys[property];
            current = current.get(key) as PathMap<K, V>;
            if (!current) {
                return undefined;
            }
        }

        return current.get(keys[this._valuePath]) as V | undefined;
    }

    public has(keys: ObjectLike<K>): boolean {
        if (isNull(keys)) {
            return false;
        }

        let current = this.root;
        for (const property of this._pathes) {
            const key = keys[property];
            current = current.get(key) as PathMap<K, V>;
            if (!current) return false;
        }

        return current.has(keys[this._valuePath]);
    }

    public delete(keys: ObjectLike<K>): boolean {
        if (isNull(keys)) {
            return false;
        }

        const path: { parent: Map<unknown, any>; key: unknown }[] = [];
        let current = this.root;

        // Traverse down and record our path
        for (const property of this._pathes) {
            const key = keys[property];
            path.push({ parent: current, key: key });
            current = current.get(key) as PathMap<K, V>;
            if (!current) return false;
        }

        const lastKey = keys[this._valuePath];
        if (!current.has(lastKey)) return false;

        // Delete the actual payload
        current.delete(lastKey);

        for (let i = path.length - 1; i >= 0; i--) {
            const { parent, key } = path[i];
            const childNode = parent.get(key);

            if (childNode.size !== 0) {
                // As soon as a map has other branches/data, stop pruning
                break;
            }

            // If the child map is completely empty, delete it from the parent
            parent.delete(key);
        }

        return true;
    }

    /**
     * Empties the entire map.
     */
    public clear(): void {
        this.root.clear();
    }

    public [Symbol.iterator](): IterableIterator<V> {
        return this.values();
    }

    public *values(): IterableIterator<V> {
        if (this.root.size === 0) return;

        yield* this._yieldValues(this.root, 0);
    }

    private *_yieldValues(currentMap: Map<unknown, any>, currentLevel: number): IterableIterator<V> {
        if (currentLevel !== this._pathes.length) {
            // We are at a branch. The map values are other Maps. Go deeper.
            for (const nextMap of currentMap.values()) {
                yield* this._yieldValues(nextMap, currentLevel + 1);
            }
            return;
        }

        // We are at the final level. The map values are the actual payloads.
        for (const value of currentMap.values()) {
            yield value as V;
        }
    }
}