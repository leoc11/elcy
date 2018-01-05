import { IObjectType } from "../../../Common/Type";
import { QueryBuilder } from "../../QueryBuilder";
import { IColumnExpression } from "./IColumnExpression";
import { IEntityExpression } from "./IEntityExpression";
import { IOrderExpression } from "./IOrderExpression";
import { SelectExpression } from "./SelectExpression";

export class ProjectionEntityExpression<T = any> implements IEntityExpression<T> {
    public select: SelectExpression;
    public name: string = "";
    public get columns(): IColumnExpression[] {
        return this.select.columns;
    }
    public get defaultOrders(): IOrderExpression[] {
        return this.select.orders;
    }
    constructor(public alias: string, public readonly type: IObjectType<T> = Object as any) {
    }
    public toString(queryBuilder: QueryBuilder): string {
        return queryBuilder.toEntityString(this);
    }
    public execute(queryBuilder: QueryBuilder) {
        return queryBuilder.toEntityString(this);
    }
}
