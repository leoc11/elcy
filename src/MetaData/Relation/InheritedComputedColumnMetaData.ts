import { GenericType } from "../../Common/Type";
import { FunctionExpression } from "../../ExpressionBuilder/Expression/FunctionExpression";
import { ComputedColumnMetaData } from "../ComputedColumnMetaData";
import { IColumnMetaData } from "../Interface/IColumnMetaData";
import { IEntityMetaData } from "../Interface/IEntityMetaData";

export class InheritedComputedColumnMetaData<TE extends TP, TP, T = any> extends ComputedColumnMetaData<TE, T> {
    public get propertyName(): keyof TE {
        return this.parentColumnMetaData.propertyName;
    }
    public get type(): GenericType<T> {
        return this.parentColumnMetaData.type;
    }
    public get parentEntity(): IEntityMetaData<TP> {
        return this.parentColumnMetaData.entity;
    }
    public get description() {
        return this.parentColumnMetaData.description;
    }
    public get functionExpression() {
        return this.parentColumnMetaData.functionExpression as FunctionExpression<T>;
    }
    public parentColumnMetaData: ComputedColumnMetaData<TP, T>;
    constructor(public entity: IEntityMetaData<TE, TP>, parentColumnMetaData: ComputedColumnMetaData<TP, T>) {
        super();
        this.applyOption(parentColumnMetaData);
    }

    /**
     * Copy
     */
    public applyOption(columnMeta: IColumnMetaData) {
        if (columnMeta instanceof InheritedComputedColumnMetaData) {
            this.parentColumnMetaData = columnMeta.parentColumnMetaData;
        }
        else if (columnMeta instanceof ComputedColumnMetaData) {
            this.parentColumnMetaData = columnMeta as ComputedColumnMetaData<TP>;
        }
    }
}
