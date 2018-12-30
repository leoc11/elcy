import { BinaryColumnType } from "../../Common/ColumnType";
import { IColumnOption } from "./IColumnOption";
import { GenericType } from "../../Common/Type";
// tslint:disable-next-line:ban-types
export interface IBinaryColumnOption extends IColumnOption<ArrayBufferView> {
    columnType?: BinaryColumnType;
    size?: number;
    type?: GenericType<ArrayBufferView>;
}
