import { IObjectType, StringKeyOf, ValueType } from "../../Common/Type";
import { ColumnMetaData } from "../../MetaData/ColumnMetaData";
import { IColumnOption } from "../Option/IColumnOption";
import { ClassAccessor, ClassPropertyDecorator } from "../Type";

export function Column<TE extends object = object, T = (ValueType | undefined)>(columnMetaType: IObjectType<ColumnMetaData<TE, T>>, columnOption: IColumnOption): ClassPropertyDecorator<TE, T> {
    return (_: undefined | ClassAccessor<T>, context: ClassFieldDecoratorContext<TE, T> | ClassAccessorDecoratorContext<TE, T>) => {
        let columns = context.metadata.columns as ColumnMetaData<TE, T>[];
        if (!Array.isArray(columns)) {
            context.metadata.columns = columns = [];
        }

        const metadata = new columnMetaType();
        metadata.isProjected = true;
        metadata.applyOption(columnOption);
        if (!metadata.columnName) {
            metadata.columnName = String(context.name);
        }
        metadata.propertyName = context.name as StringKeyOf<TE>;
        columns.push(metadata);
    }
}