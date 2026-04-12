import { ISaveEventParam } from "src/MetaData/Interface/ISaveEventParam";
import { IEntityMetaData } from "src/MetaData/Interface/IEntityMetaData";
import { IObjectType } from "../../Common/Type";
import { ClassDecorator } from "../Type";

/**
 * Register before save event. only for concrete entity
 */
export function AfterSave<TE extends object>(handler: (entity: TE, param: ISaveEventParam) => void, context: ClassMethodDecoratorContext<any, (entity: TE, param: ISaveEventParam) => void>): void;
export function AfterSave<TC extends IObjectType, TE = TC extends IObjectType<infer U> ? U : never>(handler: (entity: TE, param: ISaveEventParam) => void): ClassDecorator<TC>;
export function AfterSave<TE extends object>(handler: (entity: TE, param: ISaveEventParam) => void, context?: ClassMethodDecoratorContext<any, (entity: TE, param: ISaveEventParam) => void>): ClassDecorator<IObjectType<TE>> | void {
    const classDecorator = (_: IObjectType<TE>, context: ClassDecoratorContext<IObjectType<TE>> | ClassMethodDecoratorContext<any, (entity: TE, param: ISaveEventParam) => void>) => {
        let handlers = context.metadata.relations as Array<(entityMeta: IEntityMetaData<TE>) => void>;
        if (!Array.isArray(handlers)) {
            context.metadata.relations = handlers = [];
        }

        if (typeof handler === "function") {
            handlers.push((entityMeta) => {
                entityMeta.afterSave = handler;
            });
        }
    };

    if (context?.kind === "method") {
        return classDecorator(undefined, context);
    }

    return classDecorator;
}

