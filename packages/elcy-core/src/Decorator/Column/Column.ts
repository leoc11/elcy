import { IEntityMetaData } from "src/MetaData/Interface/IEntityMetaData";
import { GenericType, IObjectType, StringKeyOf, ValueType } from "../../Common/Type";
import { ColumnMetaData } from "../../MetaData/ColumnMetaData";
import { IColumnOption } from "../Option/IColumnOption";
import { ClassAccessor, ClassPropertyDecorator } from "../Type";
import { setColumnMetadata } from "src/MetaData/MetaDataMapper";

export function Column<TE extends object = object, T = (ValueType | undefined)>(type: GenericType<T>, columnMetaType: IObjectType<ColumnMetaData<TE, T>>, columnOption: IColumnOption): ClassPropertyDecorator<TE, T> {
    return (_: undefined | ClassAccessor<T>, context: ClassFieldDecoratorContext<TE, T> | ClassAccessorDecoratorContext<TE, T>) => {
        let columnHandlers = context.metadata.columns as Array<(entityMeta: IEntityMetaData<TE>) => void>;
        if (!Array.isArray(columnHandlers)) {
            context.metadata.columns = columnHandlers = [];
        }

        if (!columnOption.columnName) {
            columnOption.columnName = String(context.name);
        }
        columnHandlers.push((entityMeta) => {
            const metadata = new columnMetaType(entityMeta, type);
            metadata.isProjected = true;
            metadata.applyOption(columnOption);
            metadata.propertyName = context.name as StringKeyOf<TE>;

            if (entityMeta.columns.some(o => o.propertyName === metadata.propertyName)) {
                throw new Error(`Cannot re-declare column: ${metadata.propertyName}`);
            }
            entityMeta.columns.push(metadata);
            setColumnMetadata(entityMeta.type, metadata.propertyName, metadata as any);
        });
    }
}