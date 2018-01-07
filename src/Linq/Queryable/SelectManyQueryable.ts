import { genericType } from "../../Common/Type";
import { FunctionExpression, MethodCallExpression } from "../../ExpressionBuilder/Expression/index";
import { ExpressionFactory } from "../../ExpressionBuilder/ExpressionFactory";
import { Queryable } from "./Queryable";
import { SelectExpression } from "./QueryExpression";

export class SelectManyQueryable<S, T> extends Queryable<T> {
    protected readonly selector: FunctionExpression<S, T[] | Queryable<T>>;
    constructor(public readonly parent: Queryable<S>, selector: FunctionExpression<S, T[] | Queryable<T>> | ((item: S) => T[] | Queryable<T>), public type: genericType<T> = Object) {
        super(type, parent.queryBuilder);
        this.selector = selector instanceof FunctionExpression ? selector : ExpressionFactory.prototype.ToExpression<S, T[] | Queryable<T>>(selector, parent.type);
    }
    public execute(): SelectExpression<T> {
        if (!this.expression) {
            this.expression = new SelectExpression<any>(this.parent.execute() as any);
            const methodExpression = new MethodCallExpression(this.expression.entity, "selectMany", [this.selector]);
            const param = { parent: this.expression };
            this.queryBuilder.visit(methodExpression, param);
            this.expression = param.parent;
        }
        return this.expression as any;
    }
    /**
     * reverse join entity for selectmany. ex:
     * ori: order => orderDetails = left join
     * target: orderDetail => order = inner join
     */
    // protected reverseJoinEntity(rootEntity: IEntityExpression, entity: IEntityExpression): boolean {
    //     if (rootEntity instanceof JoinEntityExpression) {
    //         const isRight = this.reverseJoinEntity(rootEntity.rightEntity, entity);
    //         if (isRight) {
    //             rootEntity.joinType = "INNER";
    //             const rightEntity = rootEntity.rightEntity;
    //             rootEntity.rightEntity = rootEntity.leftEntity;
    //             rootEntity.leftEntity = rightEntity;
    //             rootEntity.relations = rootEntity.relations.select((o) => ({ leftColumn: o.rightColumn, rightColumn: o.leftColumn })).toArray();
    //             return true;
    //         }
    //         return this.reverseJoinEntity(rootEntity.leftEntity, entity);
    //     }
    //     else if (rootEntity instanceof ProjectionEntityExpression) {
    //         return this.reverseJoinEntity(rootEntity.select.entity, entity);
    //     }
    //     return rootEntity === entity;
    // }
}
