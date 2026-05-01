import { IEntityMetaData } from "src/MetaData/Interface/IEntityMetaData";
import { IObjectType } from "../../Common/Type";
import { ClassDecorator } from "../Type";

/**
 * Register before save event. only for concrete entity
 */
export function AfterLoad<TE extends object>(handler: (entity: TE) => void, context: ClassMethodDecoratorContext<any, (entity: TE) => void>): void;
export function AfterLoad<TC extends IObjectType, TE = TC extends IObjectType<infer U> ? U : never>(handler: (entity: TE) => void): ClassDecorator<TC>;
export function AfterLoad<TE extends object>(handler: (entity: TE) => void, context?: ClassMethodDecoratorContext<any, (entity: TE) => void>): ClassDecorator<IObjectType<TE>> | void {
    const classDecorator = (_: IObjectType<TE>, context: ClassDecoratorContext<IObjectType<TE>> | ClassMethodDecoratorContext<any, (entity: TE) => void>) => {
        let handlers = context.metadata.relations as Array<(entityMeta: IEntityMetaData<TE>) => void>;
        if (!Array.isArray(handlers)) {
            context.metadata.relations = handlers = [];
        }

        if (typeof handler === "function") {
            handlers.push((entityMeta) => {
                entityMeta.afterLoad = handler;
            });
        }
    };

    if (context?.kind === "method") {
        return classDecorator(undefined, context);
    }

    return classDecorator;
}

