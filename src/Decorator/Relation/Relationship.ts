import { ObservableArray } from "../../Common/ObservableArray";
import { RelationshipType } from "../../Common/StringType";
import { ElementType, IObjectType, PropertySelector, StringKeyOf } from "../../Common/Type";
import { IEventDispacher } from "../../Event/IEventHandler";
import { IRelationChangeEventParam } from "../../MetaData/Interface/IChangeEventParam";
import { RelationMetaData } from "../../MetaData/Relation/RelationMetaData";
import { relationChangeDispatherMetaKey } from "../DecoratorKey";
import { IAdditionalRelationOption, IRelationOption } from "../Option/IRelationOption";
import { getEntityMetadata, setRelationMetadata } from "../../MetaData/MetaDataMapper";
import { IRelationMetaData } from "../../MetaData/Interface/IRelationMetaData";
import { isNotNull } from "../../Helper/Util";

export function Relationship<S extends object = object, T extends object = object>(name: string, type: RelationshipType | "one?", targetType: IObjectType<T> | string, relationKeys?: Array<PropertySelector<S>>): PropertyDecorator & MethodDecorator;
export function Relationship<S extends object = object, T extends object = object>(name: string, direction: "by", type: RelationshipType | "one?", targetType: IObjectType<T> | string, relationKeys?: Array<PropertySelector<S>>, options?: IAdditionalRelationOption): PropertyDecorator & MethodDecorator;
export function Relationship<S extends object = object, T extends object = object>(name: string, typeOrDirection: RelationshipType | "one?" | "by", targetTypeOrType: IObjectType<T> | string | RelationshipType | "one?", relationKeysOrTargetType: Array<PropertySelector<S>> | IObjectType<T> | string, relationKey?: Array<PropertySelector<S>>, options?: IAdditionalRelationOption): PropertyDecorator & MethodDecorator {
    const relationOption: IRelationOption<S, T> = {
        name
    } as any;
    let targetName: string;
    let isMaster = true;
    if (typeOrDirection === "by") {
        // slave relation.
        isMaster = false;
        relationOption.relationType = targetTypeOrType as RelationshipType;
        if (typeof relationKeysOrTargetType === "string") {
            targetName = relationKeysOrTargetType;
        }
        else {
            relationOption.targetType = relationKeysOrTargetType as IObjectType<T>;
            targetName = relationOption.targetType.name;
        }
        relationOption.relationKeys = relationKey;
        if (options) {
            Object.assign(relationOption, options);
        }
    }
    else {
        // master relation.
        relationOption.relationType = typeOrDirection as RelationshipType;
        if (typeof targetTypeOrType === "string") {
            targetName = targetTypeOrType;
        }
        else {
            relationOption.targetType = targetTypeOrType as IObjectType<T>;
            targetName = relationOption.targetType.name;
        }
        relationOption.relationKeys = relationKeysOrTargetType as PropertySelector<S>[];
    }
    // TODO: FOR SQL TO-ONE relation target must be a unique or primarykeys
    // TODO: Foreignkey for SQL DB
    return <R>(target: S, propertyKey: StringKeyOf<S>, descriptor?: TypedPropertyDescriptor<R>) => {
        const isAccessor = isNotNull(descriptor);
        if (!relationOption.sourceType) {
            relationOption.sourceType = target.constructor as IObjectType<S>;
        }
        relationOption.propertyName = propertyKey;
        const sourceMetaData = getEntityMetadata(relationOption.sourceType);

        const relationMeta = new RelationMetaData(relationOption, isMaster);
        relationMeta.isMaster = isMaster;
        setRelationMetadata(relationOption.sourceType, propertyKey, relationMeta);

        const relationName = relationOption.relationKeyName ? relationOption.relationKeyName : relationOption.name + "_" + (isMaster ? relationMeta.source.type.name + "_" + targetName : targetName + "_" + relationMeta.source.type.name);
        relationMeta.fullName = relationName;
        sourceMetaData.relations.push(relationMeta);

        if (relationOption.targetType) {
            const targetMetaData = getEntityMetadata(relationOption.targetType);
            const reverseRelation = targetMetaData.relations.find((o) => o.fullName === relationName) as unknown as IRelationMetaData<T, S, RelationshipType>;

            if (reverseRelation) {
                relationMeta.completeRelation(reverseRelation);
            }
        }

        // add property to use setter getter.
        if (!isAccessor) {
            descriptor = Object.getOwnPropertyDescriptor(target, propertyKey);
            if (descriptor?.configurable === false) {
                throw new Error(`Cannot decorate property '${propertyKey}' because it not configurable`);
            }
        }

        if (!descriptor) {
            descriptor = {
                writable: true,
                enumerable: true,
                configurable: true
            };
        }

        if (descriptor.writable) {
            const privatePropertySymbol = Symbol(`_${propertyKey}`);
            Object.defineProperty(target, privatePropertySymbol, {
                value: descriptor.value,
                enumerable: false,
                writable: true,
                configurable: false
            });

            // changes detection here
            descriptor = {
                get: function (this: S) {
                    return this[privatePropertySymbol];
                },
                set: function (this: S, value: R) {
                    const oldValue = this[privatePropertySymbol] as R;
                    if (oldValue !== value) {
                        const changeListener: IEventDispacher<IRelationChangeEventParam<S, T>> = this[relationChangeDispatherMetaKey];
                        if (relationMeta.relationType === "many") {
                            const observed = ObservableArray.observe(value as ElementType<R>[] as T[] || []);
                            observed.register((type, items) => {
                                if (changeListener) {
                                    changeListener({ relation: relationMeta, type, entities: items });
                                }
                            });
                            value = observed as R;
                        }
                        this[privatePropertySymbol] = value;
                        
                        if (changeListener) {
                            if (relationMeta.relationType === "many") {
                                // NOTE: don't remove current relations,
                                // coz there might be related entity that is not loaded yet.
                                // so removing related entities could not be achived.
                                // To remove current relation, used splice instead
                                if (value && Array.isArray(value) && value.length > 0) {
                                    changeListener({ relation: relationMeta, type: "add", entities: value });
                                }
                            }
                            else {
                                // undefined mean current relation is unknown
                                if (oldValue !== null) {
                                    changeListener({ relation: relationMeta, type: "del", entities: [oldValue as unknown as T] });
                                }
                                if (value) {
                                    changeListener({ relation: relationMeta, type: "add", entities: [value as unknown as T] });
                                }
                            }
                        }
                    }
                },
                enumerable: descriptor.enumerable,
                configurable: descriptor.configurable
            };
            Object.defineProperty(target, propertyKey, descriptor);
        }
        else {
            const ori_Get = descriptor?.get;
            const ori_Set = descriptor?.set;

            descriptor.get = function (this: S) {
                return ori_Get?.call(this);
            };
            descriptor.set = function (this: S, value: R) {
                const oldValue = ori_Get?.call(this);
                if (oldValue !== value) {
                    const changeListener: IEventDispacher<IRelationChangeEventParam<S, T>> = this[relationChangeDispatherMetaKey];
                    if (relationMeta.relationType === "many") {
                        const observed = ObservableArray.observe(value as ElementType<R>[] as T[] || []);
                        observed.register((type, items) => {
                            if (changeListener) {
                                changeListener({ relation: relationMeta, type, entities: items });
                            }
                        });
                        value = observed as R;
                    }
                    ori_Set?.call(this, value);
                    
                    if (changeListener) {
                        if (relationMeta.relationType === "many") {
                            // NOTE: don't remove current relations,
                            // coz there might be related entity that is not loaded yet.
                            // so removing related entities could not be achived.
                            // To remove current relation, used splice instead
                            if (value && Array.isArray(value) && value.length > 0) {
                                changeListener({ relation: relationMeta, type: "add", entities: value });
                            }
                        }
                        else {
                            // undefined mean current relation is unknown
                            if (oldValue !== null) {
                                changeListener({ relation: relationMeta, type: "del", entities: [oldValue as unknown as T] });
                            }
                            if (value) {
                                changeListener({ relation: relationMeta, type: "add", entities: [value as unknown as T] });
                            }
                        }
                    }
                }
            };
        }
        
        return descriptor;
    };
}
