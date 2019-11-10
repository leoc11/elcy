import { IObjectType, ResultSelector } from "../../Common/Type";
import { FunctionExpression } from "../../ExpressionBuilder/Expression/FunctionExpression";
import { ObjectValueExpression } from "../../ExpressionBuilder/Expression/ObjectValueExpression";
import { ExpressionBuilder } from "../../ExpressionBuilder/ExpressionBuilder";
import { toObjectFunctionExpression } from "../../Helper/toObjectFunctionExpression";
import { hashCode, hashCodeAdd } from "../../Helper/Util";
import { Queryable } from "../../Queryable/Queryable";
import { QueryExpression } from "../../Queryable/QueryExpression/QueryExpression";
import { SelectExpression } from "../../Queryable/QueryExpression/SelectExpression";
import { UpdateExpression } from "../../Queryable/QueryExpression/UpdateExpression";
import { IQueryVisitor } from "../IQueryVisitor";
import { DMLDeferredQuery } from "./DMLDeferredQuery";

// TODO: consider parameter
export class BulkUpdateDeferredQuery<T> extends DMLDeferredQuery<T> {
    protected get setter() {
        if (!this._setter && this._setterFn) {
            if (this._setterFn instanceof Function) {
                this._setter = ExpressionBuilder.parse(this._setterFn, [this.queryable.type], this.queryable.stackTree.node).body as ObjectValueExpression<T>;
            }
            else {
                this._setter = toObjectFunctionExpression(this._setterFn as any, this.queryable.type as IObjectType<T>, "o",
                    this.queryable.stackTree.node, this.queryable.type as IObjectType<T>).body as ObjectValueExpression<T>;
            }
        }
        return this._setter;
    }
    constructor(queryable: Queryable<T>, setter: ResultSelector<T, T>) {
        super(queryable);
        if (setter instanceof FunctionExpression) {
            this._setter = setter.body as ObjectValueExpression<T>;
        }
        else {
            this._setterFn = setter;
        }
    }

    private readonly _setterFn: ResultSelector<T, T>;
    private _setter: ObjectValueExpression<T>;
    protected buildQueries(visitor: IQueryVisitor): Array<QueryExpression<T>> {
        const commandQuery = this.queryable.buildQuery(visitor) as SelectExpression<T>;
        return [new UpdateExpression(commandQuery, this.setter.object)];
    }
    protected getQueryCacheKey() {
        return hashCodeAdd(hashCode("UPDATE", super.getQueryCacheKey()), this.setter.hashCode());
    }
}
