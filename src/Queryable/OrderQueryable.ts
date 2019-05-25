import { OrderDirection } from "../Common/Type";
import { ArrayValueExpression } from "../ExpressionBuilder/Expression/ArrayValueExpression";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { IExpression } from "../ExpressionBuilder/Expression/IExpression";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { ValueExpression } from "../ExpressionBuilder/Expression/ValueExpression";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";
import { hashCode, hashCodeAdd } from "../Helper/Util";
import { IQueryVisitor } from "../Query/IQueryVisitor";
import { IQueryVisitParameter } from "../Query/IQueryVisitParameter";
import { IOrderQueryDefinition } from "./Interface/IOrderQueryDefinition";
import { Queryable } from "./Queryable";
import { IQueryExpression } from "./QueryExpression/IQueryExpression";
import { SelectExpression } from "./QueryExpression/SelectExpression";

export class OrderQueryable<T> extends Queryable<T> {
    protected get selectors() {
        if (!this._selectors && this.selectorsFn) {
            this._selectors = this.selectorsFn.select((o) => {
                const selector = o[0];
                const direction = o[1];
                const itemArray: IExpression[] = [];
                itemArray.push(selector instanceof FunctionExpression ? selector : ExpressionBuilder.parse(selector, [this.parent.type], this.parameters));
                itemArray.push(new ValueExpression(direction ? direction : "ASC"));
                return new ArrayValueExpression(...itemArray);
            }).toArray();
        }
        return this._selectors;
    }
    protected set selectors(value) {
        this._selectors = value;
    }
    constructor(public readonly parent: Queryable<T>, ...selectors: Array<IOrderQueryDefinition<T>>) {
        super(parent.type, parent);
        this.selectorsFn = selectors;
    }
    protected _selectors: Array<ArrayValueExpression<FunctionExpression | IExpression<OrderDirection>>>;
    protected readonly selectorsFn: Array<IOrderQueryDefinition<T>>;
    public buildQuery(queryVisitor: IQueryVisitor): IQueryExpression<T> {
        const objectOperand = this.parent.buildQuery(queryVisitor) as SelectExpression<T>;
        const selectors = this.selectors.map((o) => o.clone());
        const methodExpression = new MethodCallExpression(objectOperand, "orderBy", selectors);
        const visitParam: IQueryVisitParameter = { selectExpression: objectOperand, scope: "queryable" };
        return queryVisitor.visit(methodExpression, visitParam) as any;
    }
    public hashCode() {
        return hashCodeAdd(hashCode("ORDERBY", this.parent.hashCode()), this.selectors.sum((o) => o.hashCode()));
    }
}
