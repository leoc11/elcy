import { GenericType } from "../../../Common/Type";
import { columnMetaKey } from "../../../Decorator/DecoratorKey";
import { ColumnMetaData } from "../../../MetaData/index";
import { QueryBuilder } from "../../QueryBuilder";
import { IColumnExpression } from "./IColumnExpression";
import { IEntityExpression } from "./IEntityExpression";
import { ColumnType } from "../../../Common/ColumnType";
import { IColumnOption } from "../../../Decorator/Option";

export class ColumnExpression<TE = any, T = any> implements IColumnExpression<TE, T> {
    public type: GenericType<T>;
    public propertyName: string;
    public columnType: ColumnType;
    public columnName: string;
    public columnMetaData: IColumnOption<T>;
    public entity: IEntityExpression<TE>;
    public isPrimary: boolean;
    public isShadow?: boolean;
    constructor(entity: IEntityExpression<TE>, propertyName: string, isPrimary?: boolean);
    constructor(entity: IEntityExpression<TE>, propertyName: string, type: GenericType<T>, isPrimary?: boolean, name?: string);
    constructor(entity: IEntityExpression<TE>, propertyName: string, typeOrIsPrimary?: GenericType<T> | boolean, isPrimary?: boolean, name?: string) {
        this.entity = entity;
        this.propertyName = propertyName;
        let type: GenericType | undefined;
        if (typeOrIsPrimary) {
            if (typeof typeOrIsPrimary === "boolean")
                isPrimary = typeOrIsPrimary;
            else
                type = typeOrIsPrimary;
        }
        if (!type || !name) {
            const metaData: ColumnMetaData<T> = Reflect.getOwnMetadata(columnMetaKey, this.entity.type, this.propertyName);
            if (metaData) {
                type = metaData.type;
                this.columnMetaData = metaData;
                this.columnType = metaData.columnType;
                if (name === undefined) name = metaData.columnName;
            }
        }

        this.columnName = name!;
        this.type = type!;
        this.isPrimary = isPrimary!;
    }
    public toString(queryBuilder: QueryBuilder): string {
        return queryBuilder.getExpressionString(this);
    }
    public execute(queryBuilder: QueryBuilder) {
        return this.toString(queryBuilder) as any;
    }
    public clone(entity?: IEntityExpression<TE>) {
        const clone = new ColumnExpression(entity || this.entity, this.propertyName, this.type, this.isPrimary, this.columnName);
        clone.columnType = clone.columnType;
        clone.columnName = clone.columnName;
        return clone;
    }
}
