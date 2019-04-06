import { IQuery } from "./IQuery";
import { QueryType } from "../Common/Type";

export class BatchedQuery implements IQuery {
    private _queries: IQuery[] = [];
    private _isBuildComplete: boolean;
    private _query: string;
    private _parameters: Map<string, any>;
    private _type: QueryType;
    protected buildQuery() {
        this._query = "";
        this._parameters = new Map();
        this._type = QueryType.Unknown;
        for (const query of this._queries) {
            if (query.parameters) {
                for (const [prop, value] of query.parameters) {
                    this._parameters.set(prop, value);
                }
            }
            this._type |= query.type;
            this._query += query.query + ";\n\n";
        }
        if (this._query) this._query = this._query.substr(0, this._query.length - 3);
        this._isBuildComplete = true;
    }
    public get queries(): Iterable<IQuery> {
        return this._queries;
    }
    public add(query: IQuery) {
        this._queries.push(query);
        if (this._isBuildComplete) {
            this._query += ";\n\n" + query.query;
            this._type |= query.type;
            if (query.parameters) {
                for (const [prop, value] of query.parameters) {
                    this._parameters.set(prop, value);
                }
            }
        }
    }
    public remove(query: IQuery) {
        this._queries.remove(query);
        this._isBuildComplete = false;
    }
    public get query() {
        if (!this._isBuildComplete)
            this.buildQuery();
        return this._query;
    }
    public get parameters() {
        if (!this._isBuildComplete)
            this.buildQuery();
        return this._parameters;
    }
    public get type() {
        if (!this._isBuildComplete)
            this.buildQuery();
        return this._type;
    }
    public get queryCount() {
        return this._queries.length;
    }
    public get description() {
        return this.queryCount + " batch query";
    }
}
