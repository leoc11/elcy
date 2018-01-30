import { GenericType, OrderDirection } from "../../../Common/Type";
import { AndExpression, IExpression } from "../../../ExpressionBuilder/Expression/index";
import { QueryBuilder } from "../../QueryBuilder";
import { IColumnExpression } from "./IColumnExpression";
import { ICommandQueryExpression } from "./ICommandQueryExpression";
import { IEntityExpression } from "./IEntityExpression";
import { ProjectionEntityExpression } from "./index";
import { IOrderExpression } from "./IOrderExpression";
import { ColumnEntityExpression } from "./ColumnEntityExpression";

export class SelectExpression<T = any> implements ICommandQueryExpression<T> {
    [prop: string]: any;
    public parent?: ProjectionEntityExpression<T>;
    public columns: IColumnExpression[] = [];
    public entity: IEntityExpression;
    public distinct: boolean = false;
    public get type(): GenericType<T> {
        return this.entity.type;
    }
    public paging: { skip?: number, take?: number } = {};
    public where: IExpression<boolean>;
    public orders: IOrderExpression[] = [];
    constructor(entity: IEntityExpression<T> | SelectExpression<T>) {
        if (entity instanceof SelectExpression)
            this.copy(entity);
        else {
            this.entity = entity;
            this.columns = entity.columns.slice();
        }

    }
    public copy(source: SelectExpression<T>) {
        if (source) {
            // tslint:disable-next-line:forin
            for (const prop in source) {
                this[prop] = source[prop];
            }
        }
    }
    public toString(queryBuilder: QueryBuilder): string {
        return queryBuilder.getExpressionString(this);
    }
    public execute(queryBuilder: QueryBuilder): SelectExpression {
        return this;
    }
    public addWhere(expression: IExpression<boolean>) {
        this.where = this.where ? new AndExpression(this.where, expression) : expression;
    }
    public addOrder(expression: IExpression<any>, direction: OrderDirection) {
        this.orders.push({
            column: expression,
            direction: direction
        });
    }
    public getVisitParam(): IExpression {
        if (this.entity instanceof ColumnEntityExpression)
            return this.entity.column;
        return this.entity;
    }
}
