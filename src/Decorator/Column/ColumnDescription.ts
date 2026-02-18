import { ValueType } from "../../Common/Type";
import { ClassPropertyDecorator } from "../Type";
import { IColumnMetaData } from "src/MetaData/Interface/IColumnMetaData";

export function ColumnDescription<TE extends object = object, T extends ValueType = ValueType>(description: string): ClassPropertyDecorator<TE, T> {
    return (_: any, context: ClassFieldDecoratorContext<TE, T> | ClassAccessorDecoratorContext<TE, T>) => {
        const columns = context.metadata.columns as IColumnMetaData<TE>[];
        const column = columns.find(o => o.propertyName == context.name);
        if (!column) {
            throw new Error("Need to register column first");
        }
        column.description = description;
    };
}
