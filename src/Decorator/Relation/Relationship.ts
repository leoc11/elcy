import "reflect-metadata";
import { ObservableArray } from "../../Common/ObservableArray";
import { IObjectType, PropertySelector, RelationshipType } from "../../Common/Type";
import { IEventDispacher } from "../../Event/IEventHandler";
import { EntityMetaData } from "../../MetaData/EntityMetaData";
import { IRelationChangeEventParam } from "../../MetaData/Interface/IChangeEventParam";
import { RelationMetaData } from "../../MetaData/Relation/RelationMetaData";
import { entityMetaKey, relationChangeDispatherMetaKey, relationMetaKey } from "../DecoratorKey";
import { IAdditionalRelationOption, IRelationOption } from "../Option/IRelationOption";

export function Relationship<S, T = any>(name: string, type: RelationshipType | "one?", targetType: IObjectType<T> | string, relationKeys?: Array<PropertySelector<S>>): PropertyDecorator;
export function Relationship<S, T = any>(name: string, direction: "by", type: RelationshipType | "one?", targetType: IObjectType<T> | string, relationKeys?: Array<PropertySelector<S>>, options?: IAdditionalRelationOption): PropertyDecorator;
export function Relationship<S, T = any>(name: string, typeOrDirection: RelationshipType | "one?" | "by", targetTypeOrType: IObjectType<T> | string | RelationshipType | "one?", relationKeysOrTargetType: Array<PropertySelector<S>> | IObjectType<T> | string, relationKey?: Array<PropertySelector<S>>, options?: IAdditionalRelationOption): PropertyDecorator {
    const relationOption: IRelationOption<S, T> = {
        name
    } as any;
    let targetName: string;
    let isMaster = true;
    if (typeOrDirection === "by") {
        // slave relation.
        isMaster = false;
        relationOption.relationType = targetTypeOrType as any;
        if (typeof relationKeysOrTargetType === "string") {
            targetName = relationKeysOrTargetType;
        }
        else {
            relationOption.targetType = relationKeysOrTargetType as any;
            targetName = relationOption.targetType.name;
        }
        relationOption.relationKeys = relationKey as any;
        if (options) {
            Object.assign(relationOption, options);
        }
    }
    else {
        // master relation.
        relationOption.relationType = typeOrDirection as any;
        if (typeof targetTypeOrType === "string") {
            targetName = targetTypeOrType;
        }
        else {
            relationOption.targetType = targetTypeOrType as any;
            targetName = relationOption.targetType.name;
        }
        relationOption.relationKeys = relationKeysOrTargetType as any;
    }
    // TODO: FOR SQL TO-ONE relation target must be a unique or primarykeys
    // TODO: Foreignkey for SQL DB
    return (target: S, propertyKey: any) => {
        if (!relationOption.sourceType) {
            relationOption.sourceType = target.constructor as any;
        }
        relationOption.propertyName = propertyKey as any;
        const sourceMetaData: EntityMetaData<S> = Reflect.getOwnMetadata(entityMetaKey, relationOption.sourceType!);

        const relationMeta = new RelationMetaData(relationOption, isMaster);
        relationMeta.isMaster = isMaster;
        Reflect.defineMetadata(relationMetaKey, relationMeta, relationOption.sourceType!, propertyKey);

        const relationName = relationOption.relationKeyName ? relationOption.relationKeyName : relationOption.name + "_" + (isMaster ? relationMeta.source.type.name + "_" + targetName : targetName + "_" + relationMeta.source.type.name);
        relationMeta.fullName = relationName;
        sourceMetaData.relations.push(relationMeta);

        if (relationOption.targetType) {
            const targetMetaData: EntityMetaData<T> = Reflect.getOwnMetadata(entityMetaKey, relationOption.targetType);
            const reverseRelation = targetMetaData.relations.first((o) => o.fullName === relationName);

            if (reverseRelation) {
                relationMeta.completeRelation(reverseRelation);
            }
        }

        // changes detection here
        const privatePropertySymbol = Symbol(propertyKey);
        let descriptor: PropertyDescriptor = Object.getOwnPropertyDescriptor(target, propertyKey);
        let oldGet: any;
        let oldSet: any;
        if (descriptor) {
            if (descriptor.get) {
                oldGet = descriptor.get;
            }
            if (descriptor.set) {
                oldSet = descriptor.set;
            }
        }
        descriptor = {
            configurable: true,
            enumerable: true,
            get: function (this: any) {
                if (oldGet) {
                    return oldGet.apply(this);
                }
                return this[privatePropertySymbol];
            },
            set: function (this: any, value: any) {
                if (!oldGet && !this.hasOwnProperty(privatePropertySymbol)) {
                    Object.defineProperty(this, privatePropertySymbol, {
                        configurable: true,
                        enumerable: false,
                        value: undefined,
                        writable: true
                    });
                }
                const oldValue = this[propertyKey];
                if (oldValue !== value) {
                    const changeListener: IEventDispacher<IRelationChangeEventParam> = this[relationChangeDispatherMetaKey];
                    if (relationMeta.relationType === "many") {
                        const observed = ObservableArray.observe(value || []);
                        observed.register((type, items) => {
                            if (changeListener) {
                                changeListener({ relation: relationMeta, type, entities: items });
                            }
                        });
                        value = observed;
                    }
                    if (oldSet) {
                        oldSet.apply(this, value);
                    }
                    else {
                        this[privatePropertySymbol] = value;
                    }
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
                                changeListener({ relation: relationMeta, type: "del", entities: [oldValue] });
                            }
                            if (value) {
                                changeListener({ relation: relationMeta, type: "add", entities: [value] });
                            }
                        }
                    }
                }
            }
        };

        Object.defineProperty(target, propertyKey, descriptor);
    };
}
