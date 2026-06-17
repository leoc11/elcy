import { IEntityMetaData } from "src/MetaData/Interface/IEntityMetaData";
import { ClassAccessorDecorator, ClassFieldDecorator } from "../Type";

export function PrimaryKey<TE extends object, T = any>(): ClassFieldDecorator<TE, T> & ClassAccessorDecorator<TE, T> {
    return (_: unknown | { get: Function, set: Function }, context: ClassFieldDecoratorContext | ClassAccessorDecoratorContext) => {
        let columnHandlers = context.metadata.columns as Array<(entityMeta: IEntityMetaData<TE>) => void>;
        if (!Array.isArray(columnHandlers)) {
            context.metadata.columns = columnHandlers = [];
        }
        columnHandlers.push((entityMeta) => {
            const pkColumn = entityMeta.properties[context.name as keyof TE];
            if (!pkColumn) {
                throw new Error("Please register column first");
            }
            
            entityMeta.primaryKeys.push(pkColumn);
        });
    };
}
