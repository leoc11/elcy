import { IObjectType, StringKeyOf } from "../../Common/Type";
import { EmbeddedRelationMetaData } from "../../MetaData/EmbeddedColumnMetaData";
import { setRelationMetadata } from "../../MetaData/MetaDataMapper";
import { IEmbeddedRelationOption } from "../Option/IEmbeddedRelationOption";

export function EmbeddedRelationship<S extends object = object, T extends object = object>(option: IEmbeddedRelationOption<S, T>): PropertyDecorator;
export function EmbeddedRelationship<S extends object = object, T extends object = object>(type: IObjectType<T>, prefix?: string, nullable?: boolean): PropertyDecorator;
export function EmbeddedRelationship<S extends object = object, T extends object = object>(optionOrType: IEmbeddedRelationOption<S, T> | IObjectType<T>, prefix?: string, nullable?: boolean): PropertyDecorator {
    let option: IEmbeddedRelationOption<S, T> = {};
    if (optionOrType instanceof Function) {
        option.targetType = optionOrType as any;
        option.prefix = prefix;
        option.nullable = nullable;
    }
    else {
        option = option;
    }

    return (target: S, propertyKey: StringKeyOf<S>) => {
        option.sourceType = target.constructor as IObjectType<S>;
        option.propertyName = propertyKey;
        const embeddedRelationMeta = new EmbeddedRelationMetaData(option);
        setRelationMetadata(option.sourceType, propertyKey, embeddedRelationMeta as any);

        const source = embeddedRelationMeta.source;
        source.embeds.push(embeddedRelationMeta);
    };
}
