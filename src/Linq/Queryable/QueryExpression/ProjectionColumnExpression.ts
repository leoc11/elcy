import { IColumnExpression } from "./IColumnExpression";
import { GenericType } from "../../../Common/Type";
import { IEntityExpression } from "./IEntityExpression";
import { QueryBuilder } from "../../QueryBuilder";

export class ProjectionColumnExpression<TE, T> implements IColumnExpression<T, TE> {
    public get type(): GenericType<T> {
        return this.projectedColumn.type;
    }
    constructor(public readonly projectedColumn: IColumnExpression, public readonly entity: IEntityExpression<TE>) {
        if (this.projectedColumn instanceof ProjectionColumnExpression) {
            this.projectedColumn = this.projectedColumn.projectedColumn;
        }
        this.isShadow = projectedColumn.isShadow;
    }
    public get property(): string {
        return this.projectedColumn.alias ? this.projectedColumn.alias : this.projectedColumn.property;
    }
    public get isPrimary(): boolean {
        return this.projectedColumn.isPrimary;
    }
    public isShadow?: boolean;
    clone(): IColumnExpression<any, any> {
        throw new Error("Method not implemented.");
    }
    toString(queryBuilder: QueryBuilder): string {
        throw new Error("Method not implemented.");
    }
    execute(queryBuilder: QueryBuilder) {
        throw new Error("Method not implemented.");
    }
}