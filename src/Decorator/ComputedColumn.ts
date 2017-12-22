import "reflect-metadata";
import { ExpressionFactory } from "../ExpressionBuilder/ExpressionFactory";
import { EntityMetaData } from "../MetaData/EntityMetaData";
import { entityMetaKey } from "./DecoratorKey";

export function ComputedColumn<T>(fn: (o: T) => any): (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => void {
    const expressionFactory = ExpressionFactory.prototype.GetExpressionFactory(fn);
    return (target: object, propertyKey: string /* | symbol*/, descriptor: PropertyDescriptor) => {
        let entityMetaData: EntityMetaData<any> = Reflect.getOwnMetadata(entityMetaKey, target.constructor);
        if (entityMetaData == null) {
            entityMetaData = new EntityMetaData(() => target);
            Reflect.defineMetadata(entityMetaKey, entityMetaData, target);
        }

        entityMetaData.computedMembers[propertyKey] = expressionFactory;
    };
}
