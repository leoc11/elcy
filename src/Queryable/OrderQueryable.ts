import { OrderDirection } from "../Common/Type";
import { FunctionExpression, MethodCallExpression, ObjectValueExpression, ValueExpression } from "../ExpressionBuilder/Expression/index";
import { QueryBuilder } from "../QueryBuilder/QueryBuilder";
import { Queryable } from "./Queryable";
import { SelectExpression } from "./QueryExpression";
import { IQueryVisitParameter } from "../QueryBuilder/QueryExpressionVisitor";
import { hashCode } from "../Helper/Util";
import { IQueryableOrderDefinition } from "./Interface/IQueryableOrderDefinition";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";

export class OrderQueryable<T> extends Queryable<T> {
    protected readonly selectorsFn: IQueryableOrderDefinition<T>[];
    protected _selectors: ObjectValueExpression<any>[];
    protected get selectors() {
        if (!this._selectors && this.selectorsFn) {
            this._selectors = this.selectorsFn.select(o => {
                const selector = o[0];
                const direction = o[1];
                const a = {
                    selector: selector instanceof FunctionExpression ? selector : ExpressionBuilder.parse(selector, [this.parent.type]),
                    direction: new ValueExpression(direction ? direction : OrderDirection.ASC)
                };
                return new ObjectValueExpression(a);
            }).toArray();
        }
        return this._selectors;
    }
    protected set selectors(value) {
        this._selectors = value;
    }
    constructor(public readonly parent: Queryable<T>, ...selectors: IQueryableOrderDefinition<T>[]) {
        super(parent.type, parent);
        this.selectorsFn = selectors;
    }
    public buildQuery(queryBuilder: QueryBuilder): SelectExpression {
        if (!this.expression) {
            const objectOperand = this.parent.buildQuery(queryBuilder).clone() as SelectExpression;
            const methodExpression = new MethodCallExpression(objectOperand, "orderBy", this.selectors);
            const visitParam: IQueryVisitParameter = { commandExpression: objectOperand, scope: "queryable" };
            this.expression = queryBuilder.visit(methodExpression, visitParam) as SelectExpression;
        }
        return this.expression as any;
    }
    public hashCode() {
        let code = this.parent.hashCode() + hashCode("ORDERBY");
        if (this.selectorsFn) {
            code += this.selectorsFn.sum(o => hashCode(o[0].toString()) + hashCode(o[1] ? o[1] : OrderDirection.ASC));
        }
        else if (this.selectors) {
            code += this.selectors.sum(o => hashCode(o.toString()));
        }
        return code;
    }
}
