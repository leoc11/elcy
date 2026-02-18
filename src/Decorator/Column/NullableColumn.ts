import { IColumnMetaData } from "src/MetaData/Interface/IColumnMetaData";
import { ValueType } from "../../Common/Type";
import { ClassPropertyDecorator } from "../Type";

export function NullableColumn<TE extends object = object, T extends ValueType = ValueType>(): ClassPropertyDecorator<TE, T> {
    return (_: any, context: ClassFieldDecoratorContext<TE, T> | ClassAccessorDecoratorContext<TE, T>) => {
        const columns = context.metadata.columns as IColumnMetaData<TE>[];
        const column = columns.find(o => o.propertyName == context.name);
        if (!column) {
            throw new Error("Need to register column first");
        }
        column.nullable = true;
    };
}
