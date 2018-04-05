import { GenericType } from "../../../Common/Type";
import { columnMetaKey } from "../../../Decorator/DecoratorKey";
import { EntityMetaData } from "../../../MetaData/index";
import { QueryBuilder } from "../../QueryBuilder";
import { IColumnExpression } from "./IColumnExpression";
import { IEntityExpression } from "./IEntityExpression";

export class ColumnExpression<T = any, TE = any> implements IColumnExpression<T> {
    public name: string;
    public type: GenericType<T>;
    public alias?: string;
    public property: string;
    public entity: IEntityExpression<TE>;
    public isPrimary: boolean;
    public isShadow?: boolean;
    constructor(entity: IEntityExpression<TE>, propertyName: string, isPrimary?: boolean, alias?: string);
    constructor(entity: IEntityExpression<TE>, propertyName: string, type: GenericType<T>, isPrimary?: boolean, isShadow?: boolean, alias?: string, name?: string);
    constructor(entity: IEntityExpression<TE>, propertyName: string, typeOrIsPrimary?: GenericType<T> | boolean, aliasOrIsPrimary?: string | boolean, isShadow?: boolean, alias?: string, name?: string) {
        this.entity = entity;
        this.property = propertyName;
        let isPrimary: boolean | undefined, type: GenericType | undefined;
        if (typeOrIsPrimary) {
            if (typeof typeOrIsPrimary === "boolean")
                isPrimary = typeOrIsPrimary;
            else
                type = typeOrIsPrimary;
        }
        if (aliasOrIsPrimary) {
            if (typeof aliasOrIsPrimary === "string")
                alias = aliasOrIsPrimary;
            else
                isPrimary = aliasOrIsPrimary;
        }
        if (!type || !name) {
            const metaData: EntityMetaData<T, any> = Reflect.getOwnMetadata(columnMetaKey, this.entity.type, this.property);
            if (metaData) {
                type = metaData.type;
                if (name === undefined) name = metaData.name;
            }
        }

        this.name = name!;
        this.type = type!;
        this.isPrimary = isPrimary!;
        this.isShadow = isShadow;
        this.alias = alias;
    }
    public clone() {
        return new ColumnExpression(this.entity, this.property, this.isPrimary, this.alias);
    }
    public toString(queryBuilder: QueryBuilder): string {
        return queryBuilder.getExpressionString(this);
    }
    public execute(queryBuilder: QueryBuilder): string {
        return this.toString(queryBuilder);
    }
}
