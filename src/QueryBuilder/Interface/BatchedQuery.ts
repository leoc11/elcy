import { IQuery } from "./IQuery";
import { QueryType } from "../../Common/Type";

export class BatchedQuery implements IQuery {
    private _queries: IQuery[] = [];
    public get queries(): Iterable<IQuery> {
        return this._queries.asEnumerable();
    }
    public add(query: IQuery) {
        this._queries.push(query);
        if (this.query) this.query += ";\n\n";
        this.query += query.query;
        this.type |= query.type;
    }
    public remove(query: IQuery) {
        this._queries.remove(query);
        this.query = "";
        this.type = 0;
        this.parameters = {};
        this._queries.each(o => {
            if (o.parameters) Object.assign(this.parameters, o.parameters);
            this.type |= o.type;
            this.query += o.query + ";\n\n";
        });
        if (this.query) this.query = this.query.substr(0, this.query.length - 3);
    }
    public query: string = "";
    public parameters: { [key: string]: any; } = {};
    public type = QueryType.Unknown;
    public get queryCount() {
        return this._queries.length;
    }
    public get description() {
        return this.queryCount + " batch query";
    }
}