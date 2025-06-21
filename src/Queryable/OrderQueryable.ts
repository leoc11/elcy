import { OrderDirection } from "../Common/StringType";
import { ValueType } from "../Common/Type";
import { IOrderDefinition } from "../Enumerable/Interface/IOrderDefinition";
import { ArrayValueExpression } from "../ExpressionBuilder/Expression/ArrayValueExpression";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { IExpression } from "../ExpressionBuilder/Expression/IExpression";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { ValueExpression } from "../ExpressionBuilder/Expression/ValueExpression";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";
import { hashCode, hashCodeAdd } from "../Helper/Util";
import { IQueryVisitor } from "../Query/IQueryVisitor";
import { IQueryVisitParameter } from "../Query/IQueryVisitParameter";
import { Queryable } from "./Queryable";
import { IQueryExpression } from "./QueryExpression/IQueryExpression";
import { SelectExpression } from "./QueryExpression/SelectExpression";

export class OrderQueryable<T> extends Queryable<T> {
    protected get selectors() {
        if (!this._selectors && this.selectorsFn) {
            this._selectors = this.selectorsFn.select((o) => {
                const selector = o[0];
                const direction = o[1];
                const itemArray: Array<IExpression<((...param: T[]) => ValueType) | OrderDirection>> = [];
                itemArray.push(selector instanceof FunctionExpression ? selector as FunctionExpression<ValueType, T> : ExpressionBuilder.parse<ValueType, T>(selector, [this.parent.type], this.parameters));
                itemArray.push(new ValueExpression(direction ? direction : "ASC"));
                return new ArrayValueExpression(...itemArray);
            }).toArray();
        }
        return this._selectors;
    }
    protected set selectors(value) {
        this._selectors = value;
    }
    constructor(public readonly parent: Queryable<T>, ...selectors: Array<ArrayValueExpression<((...param: T[]) => ValueType) | OrderDirection>> | Array<IOrderDefinition<T>>) {
        super(parent.type, parent);

        if (selectors[0] instanceof ArrayValueExpression) {
            this.selectors = selectors as Array<ArrayValueExpression<((...param: T[]) => ValueType) | OrderDirection>>;
        }
        else {
            this.selectorsFn = selectors as Array<IOrderDefinition<T>>;
        }
    }
    protected _selectors: Array<ArrayValueExpression<((...param: T[]) => ValueType) | OrderDirection>>;
    protected readonly selectorsFn: Array<IOrderDefinition<T>>;
    public buildQuery(queryVisitor: IQueryVisitor): IQueryExpression<T> {
        const objectOperand = this.parent.buildQuery(queryVisitor) as SelectExpression<T>;
        const selectors = this.selectors.map((o) => o.clone());
        const methodExpression = new MethodCallExpression(objectOperand, "orderBy", selectors);
        const visitParam: IQueryVisitParameter<T> = { selectExpression: objectOperand, scope: "queryable" };
        return queryVisitor.visit(methodExpression, visitParam) as IQueryExpression<T>;
    }
    public hashCode() {
        return hashCodeAdd(hashCode("ORDERBY", this.parent.hashCode()), this.selectors.sum((o) => o.hashCode()));
    }
}
