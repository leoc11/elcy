import { ColumnGeneration } from "../Common/Enum";
import { GenericType, StringKeyOf, ValueType } from "../Common/Type";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";
import { IColumnMetaData } from "./Interface/IColumnMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";

export class ComputedColumnMetaData<TE extends object = object, T = ValueType> implements IColumnMetaData<TE, T> {
    public get type(): GenericType<T> {
        return this.functionExpression.returnType;
    }
    constructor();
    constructor(entity: IEntityMetaData<TE>, fn: (item: TE) => T, propertyName: StringKeyOf<TE>)
    constructor(entity?: IEntityMetaData<TE>, fn?: (item: TE) => T, propertyName?: StringKeyOf<TE>) {
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
    private _description: string;
    public get description() {
        return this._description;
    };
    public set description(value) {
        this._description = value;
    };
    public entity: IEntityMetaData<TE>;
    private _functionExpression: FunctionExpression<T, TE>;
    public get functionExpression() {
        return this._functionExpression;
    };
    public set functionExpression(value) {
        this._functionExpression = value;
    };
    private _propertyName: StringKeyOf<TE>;
    public get propertyName() {
        return this._propertyName;
    };
    public set propertyName(value) {
        this._propertyName = value;
    };

    public applyOption(option: ComputedColumnMetaData<TE, T>): void
    public applyOption(option: IColumnMetaData<TE, T>): void {
        if(!(option instanceof ComputedColumnMetaData)) {
            return;
        }

        if (typeof option.functionExpression !== "undefined") {
            this.functionExpression = option.functionExpression;
        }
        if (typeof option.propertyName !== "undefined") {
            this.propertyName = option.propertyName;
        }
        this.propertyName = option.propertyName;
        if (option.description) {
            this.description = option.description;
        }
    }
}
