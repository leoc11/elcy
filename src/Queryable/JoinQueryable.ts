import { INodeTree, ParameterStack } from "../Common/ParameterStack";
import { JoinType } from "../Common/StringType";
import { IObjectType } from "../Common/Type";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { IExpression } from "../ExpressionBuilder/Expression/IExpression";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";
import { IQueryVisitor } from "../Query/IQueryVisitor";
import { IQueryVisitParameter } from "../Query/IQueryVisitParameter";
import { Queryable } from "./Queryable";
import { QueryExpression } from "./QueryExpression/QueryExpression";
import { SelectExpression } from "./QueryExpression/SelectExpression";

export abstract class JoinQueryable<T = any, T2 = any, R = any> extends Queryable<R> {
    public get stackTree() {
        if (!this._param) {
            this._param = {
                node: this.parent.stackTree.node,
                childrens: Array.from(this.parent.stackTree.childrens)
            };
            this._param.childrens.push(this.parent2.stackTree);
        }
        return this._param;
    }
    protected get relation() {
        if (!this._relation && this.relationFn) {
            this._relation = ExpressionBuilder.parse<boolean>(this.relationFn, [this.parent.type, this.parent2.type], this.stackTree.node);
        }
        return this._relation;
    }
    protected set relation(value) {
        this._relation = value;
    }
    protected get resultSelector() {
        if (!this._resultSelector && this.resultSelectorFn) {
            this._resultSelector = ExpressionBuilder.parse(this.resultSelectorFn, [this.parent.type, this.parent2.type], this.stackTree.node);
        }
        return this._resultSelector;
    }
    protected set resultSelector(value) {
        this._resultSelector = value;
    }
    constructor(protected joinType: JoinType, parent: Queryable<T>, protected readonly parent2: Queryable<T2>, relation: FunctionExpression<boolean> | ((item: T, item2: T2) => boolean), resultSelector?: FunctionExpression<R> | ((item1: T | null, item2: T2 | null) => R), public type: IObjectType<R> = Object as any) {
        super(type, parent);
        this.option(this.parent2.queryOption);
        if (relation instanceof FunctionExpression) {
            this.relation = relation;
        }
        else {
            this.relationFn = relation;
        }

        if (resultSelector) {
            if (resultSelector instanceof FunctionExpression) {
                this.resultSelector = resultSelector;
            }
            else {
                this.resultSelectorFn = resultSelector;
            }
        }
    }
    protected readonly relationFn: (item: T, item2: T2) => boolean;
    protected readonly resultSelectorFn: (item1: T | null, item2: T2 | null) => R;
    private _param: INodeTree<ParameterStack>;
    private _relation: FunctionExpression<boolean>;
    private _resultSelector: FunctionExpression<R>;
    public buildQuery(visitor: IQueryVisitor): QueryExpression<R[]> {
        const childOperand = this.parent2.buildQuery(visitor) as SelectExpression<T2>;
        const objectOperand = this.parent.buildQuery(visitor) as SelectExpression<T>;
        objectOperand.parameterTree.childrens.push(childOperand.parameterTree);

        const type = this.joinType.toLowerCase() + "Join";
        const params: IExpression[] = [childOperand];
        if (this.joinType !== "CROSS") {
            params.push(this.relation.clone());
        }
        params.push(this.resultSelector.clone());
        const methodExpression = new MethodCallExpression(objectOperand, type as any, params);
        const visitParam: IQueryVisitParameter = { selectExpression: objectOperand, scope: "queryable" };
        return visitor.visit(methodExpression, visitParam) as any;
    }
}
