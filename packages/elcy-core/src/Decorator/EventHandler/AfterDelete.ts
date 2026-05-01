import { IObjectType } from "../../Common/Type";
import { IDeleteEventParam } from "../../MetaData/Interface/IDeleteEventParam";
import { IEntityMetaData } from "../../MetaData/Interface/IEntityMetaData";
import { ClassDecorator } from "../Type";

/**
 * Register before save event. only for concrete entity
 */
export function AfterDelete<TE extends object>(handler: (entity: TE, param: IDeleteEventParam) => void, context: ClassMethodDecoratorContext<any, (entity: TE, param: IDeleteEventParam) => void>): void;
export function AfterDelete<TC extends IObjectType, TE = TC extends IObjectType<infer U> ? U : never>(handler: (entity: TE, param: IDeleteEventParam) => void): ClassDecorator<TC>;
export function AfterDelete<TE extends object>(handler: (entity: TE, param: IDeleteEventParam) => void, context?: ClassMethodDecoratorContext<any, (entity: TE, param: IDeleteEventParam) => void>): ClassDecorator<IObjectType<TE>> | void {
    const classDecorator = (_: IObjectType<TE>, context: ClassDecoratorContext<IObjectType<TE>> | ClassMethodDecoratorContext<any, (entity: TE, param: IDeleteEventParam) => void>) => {
        let handlers = context.metadata.relations as Array<(entityMeta: IEntityMetaData<TE>) => void>;
        if (!Array.isArray(handlers)) {
            context.metadata.relations = handlers = [];
        }

        if (typeof handler === "function") {
            handlers.push((entityMeta) => {
                entityMeta.afterDelete = handler;
            });
        }
    };

    if (context?.kind === "method") {
        return classDecorator(undefined, context);
    }

    return classDecorator;
}
