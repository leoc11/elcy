import { IEntityMetaData } from "src/MetaData/Interface/IEntityMetaData";
import { IObjectType } from "../../Common/Type";
import { ISaveEventParam } from "../../MetaData/Interface/ISaveEventParam";
import { ClassDecorator } from "../Type";

/**
 * Register before save event. only for concrete
 * @handler: if named function was passed, then it will override last function with the same name
 */
export function BeforeSave<TE extends object>(handler: (entity: TE, param: ISaveEventParam) => boolean, context: ClassMethodDecoratorContext<any, (entity: TE, param: ISaveEventParam) => boolean>): void;
export function BeforeSave<TC extends IObjectType, TE = TC extends IObjectType<infer U> ? U : never>(handler: (entity: TE, param: ISaveEventParam) => boolean): ClassDecorator<TC>;
export function BeforeSave<TE extends object>(handler: (entity: TE, param: ISaveEventParam) => boolean, context?: ClassMethodDecoratorContext<any, (entity: TE, param: ISaveEventParam) => boolean>): ClassDecorator<IObjectType<TE>> | void {
    const classDecorator = (_: IObjectType<TE>, context: ClassDecoratorContext<IObjectType<TE>> | ClassMethodDecoratorContext<any, (entity: TE, param: ISaveEventParam) => boolean>) => {
        let handlers = context.metadata.relations as Array<(entityMeta: IEntityMetaData<TE>) => void>;
        if (!Array.isArray(handlers)) {
            context.metadata.relations = handlers = [];
        }

        if (typeof handler === "function") {
            handlers.push((entityMeta) => {
                entityMeta.beforeSave = handler;
            });
        }
    };

    if (context?.kind === "method") {
        return classDecorator(undefined, context);
    }

    return classDecorator;
}
