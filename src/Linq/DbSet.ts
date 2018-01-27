import { IObjectType } from "../Common/Type";
import { DbContext } from "./DBContext";
import { NamingStrategy } from "./NamingStrategy";
import { Queryable } from "./Queryable";
import "./Queryable/Queryable.partial";
import { ICommandQueryExpression } from "./Queryable/QueryExpression/ICommandQueryExpression";
import { EntityExpression, SelectExpression } from "./Queryable/QueryExpression/index";
import { QueryBuilder } from "./QueryBuilder";

export class DbSet<T> extends Queryable<T> {
    public get queryBuilder(): QueryBuilder {
        if (!this._queryBuilder) {
            this._queryBuilder = new this.queryBuilderType();
        }
        return this._queryBuilder;
    }
    public queryBuilderType: IObjectType<QueryBuilder>;
    /**
     * Naming strategy to be used to name tables and columns in the database.
     */
    public readonly namingStrategy: NamingStrategy;
    private _queryBuilder: QueryBuilder;

    constructor(public readonly type: IObjectType<T>, context: DbContext) {
        super(type);
        this.queryBuilderType = context.queryBuilder;
    }

    public buildQuery(queryBuilder?: QueryBuilder): ICommandQueryExpression<T> {
        if (!this.expression) {
            this.expression = new SelectExpression(new EntityExpression(this.type, (queryBuilder ? queryBuilder : this.queryBuilder).newAlias()));
        }
        return this.expression;
    }
    public toString() {
        return this.buildQuery(this.queryBuilder).toString(this.queryBuilder);
    }

    // public update(setter: {[key in keyof T]: T[key]}, predicate?: (item: T) => boolean): number {
    //     return 0;
    // }

    // public delete(predicate: (item: T) => boolean, isHardDelete = false): number {
    //     return 0;
    // }
}
