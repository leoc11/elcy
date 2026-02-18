import { ClassAccessorDecorator, ClassFieldDecorator } from "../Type";

export function PrimaryKey<TE extends object, T = any>(): ClassFieldDecorator<TE, T> & ClassAccessorDecorator<TE, T> {
    return (_: unknown | { get: Function, set: Function }, context: ClassFieldDecoratorContext | ClassAccessorDecoratorContext) => {
        let primaryKeys = context.metadata.primaryKeys as Set<string | Symbol>;
        if (!Array.isArray(primaryKeys)) {
            context.metadata.primaryKeys = primaryKeys = new Set();
        }
        primaryKeys.add(context.name);
    };
}
