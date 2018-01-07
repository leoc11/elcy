import { IObjectType } from "../../../Common/Type";
import { QueryBuilder } from "../../QueryBuilder";
import { IColumnExpression } from "./IColumnExpression";
import { IEntityExpression } from "./IEntityExpression";
import { IOrderExpression } from "./IOrderExpression";
import { SelectExpression } from "./SelectExpression";

export class ProjectionEntityExpression<T = any> implements IEntityExpression<T> {
    public name: string = "";
    public get columns(): IColumnExpression[] {
        return this.select.columns;
    }
    public get defaultOrders(): IOrderExpression[] {
        return this.select.orders;
    }
    constructor(public select: SelectExpression, public alias: string, public readonly type: IObjectType<T> = Object as any) {
    }
    public toString(queryBuilder: QueryBuilder): string {
        return queryBuilder.getEntityQueryString(this);
    }
    public execute(queryBuilder: QueryBuilder) {
        return queryBuilder.getEntityQueryString(this);
    }

    public has<TE>(type: IObjectType<TE>) {
        return this.type.name === type.name || this.select.entity.has(type);
    }
    public get<TE>(type: IObjectType<TE>): IEntityExpression<TE> {
        if (this.type.name === type.name)
            return this as any;
        return this.select.entity.get(type);
    }
}
