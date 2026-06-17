import { IEntityMetaData } from "src/MetaData/Interface/IEntityMetaData";
import { ValueType } from "../../Common/Type";
import { ClassPropertyDecorator } from "../Type";

export function ColumnDescription<TE extends object = object>(description: string): ClassPropertyDecorator<TE, ValueType> {
    return (_: any, context: ClassFieldDecoratorContext<TE, ValueType> | ClassAccessorDecoratorContext<TE, ValueType>) => {
        let columnHandlers = context.metadata.columns as Array<(entityMeta: IEntityMetaData<TE>) => void>;
        if (!Array.isArray(columnHandlers)) {
            context.metadata.columns = columnHandlers = [];
        }

        columnHandlers.push((entityMeta) => {
            const column = entityMeta.properties[context.name as keyof TE];
            if (!column) {
                throw new Error("Please egister column first");
            }

            column.description = description;
        });
    };
}
