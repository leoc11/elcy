import { IEntityMetaData } from "src/MetaData/Interface/IEntityMetaData";
import { IObjectType } from "../../Common/Type";
import { IDeleteEventParam } from "../../MetaData/Interface/IDeleteEventParam";
import { ClassDecorator } from "../Type";
/**
 * Register before save event. only for concrete entity
 */
export function BeforeDelete<TE extends object>(handler: (entity: TE, param: IDeleteEventParam) => boolean, context: ClassMethodDecoratorContext<any, (entity: TE, param: IDeleteEventParam) => boolean>): void;
export function BeforeDelete<TC extends IObjectType, TE = TC extends IObjectType<infer U> ? U : never>(handler: (entity: TE, param: IDeleteEventParam) => boolean): ClassDecorator<TC>;
export function BeforeDelete<TE extends object>(handler: (entity: TE, param: IDeleteEventParam) => boolean, context?: ClassMethodDecoratorContext<any, (entity: TE, param: IDeleteEventParam) => boolean>): ClassDecorator<IObjectType<TE>> | void {
    const classDecorator = (_: IObjectType<TE>, context: ClassDecoratorContext<IObjectType<TE>> | ClassMethodDecoratorContext<any, (entity: TE, param: IDeleteEventParam) => boolean>) => {
        let handlers = context.metadata.relations as Array<(entityMeta: IEntityMetaData<TE>) => void>;
        if (!Array.isArray(handlers)) {
            context.metadata.relations = handlers = [];
        }

        if (typeof handler === "function") {
            handlers.push((entityMeta) => {
                entityMeta.beforeDelete = handler;
            });
        }
    };

    if (context?.kind === "method") {
        return classDecorator(undefined, context);
    }

    return classDecorator;
}

