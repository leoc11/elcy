import { ArrayExtension } from "src/Extensions/ArrayExtension";
import { QueryType } from "../Common/Enum";
import { IQuery } from "./IQuery";
import { isNull } from "src/Helper/Util";

export class BatchedQuery implements IQuery {
    public get comment() {
        return this.queryCount + " batch query";
    }
    public get parameters() {
        if (!this._isProcessed) {
            this.buildQuery();
        }
        return this._parameters;
    }
    public get queries(): readonly IQuery[] {
        return this._queries;
    }
    public get query() {
        if (!this._isProcessed) {
            this.buildQuery();
        }
        return this._query;
    }
    public get queryCount() {
        return this._queries.length;
    }
    public get type() {
        if (!this._isProcessed) {
            this.buildQuery();
        }
        return this._type;
    }
    private _isProcessed: boolean;
    private _parameters: Map<string, any>;
    private _queries: IQuery[] = [];
    private _query: string;
    private _type: QueryType;
    public add(...queries: IQuery[]) {
        queries = queries.flatMap(o => o instanceof BatchedQuery ? o._queries : [o]);
        this._queries.push(...queries);
        if (this._isProcessed) {
            this.process(...queries);
        }
    }
    public remove(query: IQuery) {
        ArrayExtension.delete(this._queries, query);
        this._isProcessed = false;
    }
    protected buildQuery() {
        this._query = "";
        this._parameters = new Map();
        this._type = QueryType.Unknown;
        this._isProcessed = true;
        this.process(...this._queries);
    }
    public toJSON(): IQuery {
        return {
            comment: this.comment,
            query: this.query,
            type: this.type,
            parameters: this.parameters
        };
    }
    protected process(...queries: IQuery[]) {
        if (!queries.length) {
            return;
        }

        for (const query of queries) {
            this._type |= query.type;
            if (!query.parameters) {
                this._query += query.query + ";\n\n";
                continue;
            }

            const replaceMap = new Map<string, string>();
            for (const [prop, value] of query.parameters) {
                if (!this._parameters.has(prop)) {
                    this._parameters.set(prop, value);
                    continue;
                }

                let newName: string;
                switch (prop[0]) {
                    case "?": {
                        newName = `?${this._parameters.size}`;
                        break;
                    }
                    case "$": {
                        newName = `$${this._parameters.size + 1}`;
                        replaceMap.set(prop, newName);
                        break;
                    }
                    default: {
                        newName = `${prop}_${this._queries.length}`;
                        replaceMap.set(prop, newName);
                        break;
                    }
                }
                this._parameters.set(newName, value);
            }

            if (!replaceMap.size) {
                this._query += query.query + ";\n\n";
                continue;
            }
            this._query += this.resolveQuery(query.query, replaceMap) + ";\n\n";
        }

        if (this._query) {
            this._query = this._query.substring(0, this._query.length - 3);
        }
    }
    private resolveQuery(query: string, replaceMap: Map<string, string>) {
        type TrieNode = { [key: string]: TrieNode | string };

        // TODO: enclose map should be per dbtype
        const encloseMap: Record<string, string> = { "'": "'", "\"": "\"", "[": "]" };
        const rootNode: TrieNode = {};
        for (const [key, value] of replaceMap) {
            if (!key) continue;

            let r = rootNode;
            const last = key[key.length - 1];
            const path = key.slice(0, -1);
            for (const char of path) {
                if (!r[char]) {
                    r[char] = {};
                }
                r = r[char] as TrieNode;
            }
            r[last] = value;
        }

        let result = "";
        let candidate = "";
        let currentNode: TrieNode | string = rootNode;
        for (let i = 0, len = query.length; i < len;) {
            let char = query[i++];
            const endChar = encloseMap[char];
            if (endChar && candidate.length === 0) {
                result += char;
                while (i < len) {
                    char = query[i++];
                    result += char;
                    if (char === endChar) break;
                }
                continue;
            }

            currentNode = currentNode[char];
            if (!isNull(currentNode)) {
                candidate += char;
                if (typeof currentNode === "string") {
                    result += currentNode;
                    candidate = "";
                    currentNode = rootNode;
                }
                continue;
            }

            result += candidate + char;
            candidate = "";
            currentNode = rootNode;
        }

        return result + candidate;
    }
}
