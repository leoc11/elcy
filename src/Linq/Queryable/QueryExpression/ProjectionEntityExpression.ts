import { IObjectType } from "../../../Common/Type";
import { QueryBuilder } from "../../QueryBuilder";
import { IColumnExpression } from "./IColumnExpression";
import { IEntityExpression } from "./IEntityExpression";
import { IOrderExpression } from "./IOrderExpression";
import { JoinEntityExpression } from "./JoinEntityExpression";
import { SelectExpression } from "./SelectExpression";

export class ProjectionEntityExpression<T = any> implements IEntityExpression<T> {
    public name: string = "";
    public parent?: JoinEntityExpression<any>;
    public get columns(): IColumnExpression[] {
        return this.select.columns;
    }
    public get primaryColumns(): IColumnExpression[] {
        return this.select.primaryColumns;
    }
    public get defaultOrders(): IOrderExpression[] {
        return this.select.orders;
    }
    constructor(public select: SelectExpression, public alias: string, public readonly type: IObjectType<T> = Object as any) {
    }
    public toString(queryBuilder: QueryBuilder): string {
        return queryBuilder.getExpressionString(this);
    }
    public execute(queryBuilder: QueryBuilder): any {
        return queryBuilder.getExpressionString(this);
    }
}
