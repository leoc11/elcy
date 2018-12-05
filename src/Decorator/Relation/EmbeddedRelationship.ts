import "reflect-metadata";
import { IObjectType } from "../../Common/Type";
import { EmbeddedRelationMetaData } from "../../MetaData/EmbeddedColumnMetaData";
import { IEmbeddedRelationOption } from "../Option/IEmbeddedRelationOption";
import { relationMetaKey } from "../DecoratorKey";

export function EmbeddedRelationship<S = any, T = any>(option: IEmbeddedRelationOption<S, T>): PropertyDecorator;
export function EmbeddedRelationship<S = any, T = any>(type: IObjectType<T>, prefix?: string, nullable?: boolean): PropertyDecorator;
export function EmbeddedRelationship<S = any, T = any>(optionOrType: IEmbeddedRelationOption<S, T> | IObjectType<T>, prefix?: string, nullable?: boolean): PropertyDecorator {
    let option: IEmbeddedRelationOption<S, T> = {};
    if (optionOrType instanceof Function) {
        option.targetType = optionOrType as any;
        option.prefix = prefix;
        option.nullable = nullable;
    }
    else {
        option = option;
    }

    return (target: S, propertyKey: keyof S) => {
        option.sourceType = target.constructor as any;
        option.propertyName = propertyKey;
        const embeddedRelationMeta = new EmbeddedRelationMetaData(option);
        Reflect.defineMetadata(relationMetaKey, embeddedRelationMeta, option.sourceType!, propertyKey);

        const source = embeddedRelationMeta.source;
        source.embeds.push(embeddedRelationMeta);
    };
}
