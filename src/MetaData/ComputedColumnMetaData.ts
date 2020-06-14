import { ColumnGeneration } from "../Common/Enum";
import { GenericType } from "../Common/Type";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";
import { IColumnMetaData } from "./Interface/IColumnMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";

export class ComputedColumnMetaData<TE = any, T = any> implements IColumnMetaData<TE, T> {
    public get type(): GenericType<T> {
        return this.functionExpression.type;
    }
    constructor();
    constructor(entity: IEntityMetaData<TE>, fn: (item: TE) => T, propertyName: keyof TE)
    constructor(entity?: IEntityMetaData<TE>, fn?: (item: TE) => T, propertyName?: keyof TE) {
        if (entity) {
            this.entity = entity;
        }
        if (fn) {
            this.functionExpression = ExpressionBuilder.parse(fn, [entity.type]);
        }
        if (propertyName) {
            this.propertyName = propertyName;
        }
    }
    public get generation() {
        return ColumnGeneration.Insert | ColumnGeneration.Update;
    }
    public columnName = "";
    public description: string;
    public entity: IEntityMetaData<TE>;
    public functionExpression: FunctionExpression<T>;
    public propertyName: keyof TE;
    public applyOption(option: ComputedColumnMetaData<TE>): void {
        if (typeof option.functionExpression !== "undefined") {
            this.functionExpression = option.functionExpression;
        }
        if (typeof option.propertyName !== "undefined") {
            this.propertyName = option.propertyName;
        }
        this.propertyName = option.propertyName as any;
        if (option.description) {
            this.description = option.description;
        }
    }
}
