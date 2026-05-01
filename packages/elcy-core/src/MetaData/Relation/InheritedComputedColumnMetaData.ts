import type { GenericType, StringKeyOf, ValueType } from "../../Common/Type";
import type { IColumnMetaData } from "../Interface/IColumnMetaData";
import type { IEntityMetaData } from "../Interface/IEntityMetaData";
import { ComputedColumnMetaData } from "../ComputedColumnMetaData";
import { FunctionExpression } from "../../ExpressionBuilder/Expression/FunctionExpression";

export class InheritedComputedColumnMetaData<TE extends TP, TP extends object, T = ValueType> extends ComputedColumnMetaData<TE, T> {
    public override get description() {
        return this.parentColumnMetaData.description;
    }
    public override get functionExpression() {
        return this.parentColumnMetaData.functionExpression as FunctionExpression<T, [TE]>;
    }
    public get parentEntity(): IEntityMetaData<TP> {
        return this.parentColumnMetaData.entity;
    }
    public override get propertyName() {
        return this.parentColumnMetaData.propertyName as StringKeyOf<TE>;
    }
    public override get type(): GenericType<T> {
        return this.parentColumnMetaData.type;
    }
    constructor(public override entity: IEntityMetaData<TE, TP>, parentColumnMetaData: ComputedColumnMetaData<TP, T>) {
        super();
        this.applyOption(parentColumnMetaData as unknown as IColumnMetaData<TE, T>);
    }
    public parentColumnMetaData: ComputedColumnMetaData<TP, T>;

    /**
     * Copy
     */
    public override applyOption(columnMeta: IColumnMetaData<TE, T>) {
        if (columnMeta instanceof InheritedComputedColumnMetaData) {
            this.parentColumnMetaData = columnMeta.parentColumnMetaData;
        }
        else if (columnMeta instanceof ComputedColumnMetaData) {
            this.parentColumnMetaData = columnMeta as ComputedColumnMetaData<TP, T>;
        }
    }
}
