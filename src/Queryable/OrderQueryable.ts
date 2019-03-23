import { OrderDirection } from "../Common/Type";
import { Queryable } from "./Queryable";
import { IQueryVisitParameter } from "../Query/IQueryVisitParameter";
import { hashCode, hashCodeAdd } from "../Helper/Util";
import { IOrderQueryDefinition } from "./Interface/IOrderQueryDefinition";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { ValueExpression } from "../ExpressionBuilder/Expression/ValueExpression";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { IExpression } from "../ExpressionBuilder/Expression/IExpression";
import { IQueryExpression } from "./QueryExpression/IQueryStatementExpression";
import { SelectExpression } from "./QueryExpression/SelectExpression";
import { ArrayValueExpression } from "../ExpressionBuilder/Expression/ArrayValueExpression";
import { IQueryVisitor } from "../Query/IQueryVisitor";

export class OrderQueryable<T> extends Queryable<T> {
    protected readonly selectorsFn: IOrderQueryDefinition<T>[];
    protected _selectors: Array<ArrayValueExpression<FunctionExpression | IExpression<OrderDirection>>>;
    protected get selectors() {
        if (!this._selectors && this.selectorsFn) {
            this._selectors = this.selectorsFn.select(o => {
                const selector = o[0];
                const direction = o[1];
                const itemArray: IExpression[] = [];
                itemArray.push(selector instanceof FunctionExpression ? selector : ExpressionBuilder.parse(selector, this.flatParameterStacks));
                itemArray.push(new ValueExpression(direction ? direction : "ASC"));
                return new ArrayValueExpression(...itemArray);
            }).toArray();
        }
        return this._selectors;
    }
    protected set selectors(value) {
        this._selectors = value;
    }
    constructor(public readonly parent: Queryable<T>, ...selectors: IOrderQueryDefinition<T>[]) {
        super(parent.type, parent);
        this.selectorsFn = selectors;
    }
    public buildQuery(queryVisitor: IQueryVisitor): IQueryExpression<T> {
        const objectOperand = this.parent.buildQuery(queryVisitor) as SelectExpression<T>;
        const methodExpression = new MethodCallExpression(objectOperand, "orderBy", this.selectors);
        const visitParam: IQueryVisitParameter = { selectExpression: objectOperand, scope: "queryable" };
        return queryVisitor.visit(methodExpression, visitParam) as any;
    }
    public hashCode() {
        return hashCodeAdd(hashCode("ORDERBY", this.parent.hashCode()), this.selectors.sum(o => o.hashCode()));
    }
}
