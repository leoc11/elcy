import { BinaryColumnType } from "../../Common/ColumnType";
import { GenericType } from "../../Common/Type";
import { IColumnOption } from "./IColumnOption";
// tslint:disable-next-line:ban-types
export interface IBinaryColumnOption extends IColumnOption<ArrayBufferView> {
    columnType?: BinaryColumnType;
    size?: number;
    type?: GenericType<ArrayBufferView>;
}
