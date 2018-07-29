import "reflect-metadata";
import { IObjectType, RelationshipType, PropertySelector } from "../../Common/Type";
import { EntityMetaData } from "../../MetaData/EntityMetaData";
import { entityMetaKey, relationMetaKey, relationChangeDispatherMetaKey } from "../DecoratorKey";
import { IRelationOption, IAdditionalRelationOption } from "../Option/IRelationOption";
import { RelationMetaData } from "../../MetaData/Relation/RelationMetaData";
import { RelationChangeType, IRelationChangeEventParam } from "../../MetaData/Interface/IChangeEventParam";
import { IEventDispacher } from "../../Event/IEventHandler";

export function Relationship<S, T = any>(name: string, type: RelationshipType | "one?", targetType: IObjectType<T> | string, relationKeys?: Array<PropertySelector<S>>): PropertyDecorator;
export function Relationship<S, T = any>(name: string, type: RelationshipType | "one?", targetType: IObjectType<T> | string, relationKeys?: Array<PropertySelector<S>>): PropertyDecorator;
export function Relationship<S, T = any>(name: string, direction: "by", type: RelationshipType | "one?", targetType: IObjectType<T> | string, relationKeys?: Array<PropertySelector<S>>, options?: IAdditionalRelationOption): PropertyDecorator;
export function Relationship<S, T = any>(name: string, typeOrDirection: RelationshipType | "one?" | "by", targetTypeOrType: IObjectType<T> | string | RelationshipType | "one?", relationKeysOrTargetType: Array<PropertySelector<S>> | IObjectType<T> | string, relationKey?: Array<PropertySelector<S>>, options?: IAdditionalRelationOption): PropertyDecorator {
    let relationOption: IRelationOption<S, T> = {
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
        if (options)
            Object.assign(relationOption, options);
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
        if (!relationOption.sourceType)
            relationOption.sourceType = target.constructor as any;
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
            const reverseRelation = targetMetaData.relations.first(o => o.fullName === relationName);

            if (reverseRelation) {
                relationMeta.completeRelation(reverseRelation);
            }
        }

        // changes detection here
        const privatePropertySymbol = Symbol(propertyKey);
        let descriptor: PropertyDescriptor = Object.getOwnPropertyDescriptor(target, propertyKey);
        let oldGet: any, oldSet: any;
        if (descriptor) {
            if (descriptor.get) {
                oldGet = descriptor.get;
            }
            if (descriptor.set) {
                oldSet = descriptor.set;
            }
        }
        descriptor = {
            set: function (this: any, value: any) {
                if (!oldGet && !this.hasOwnProperty(privatePropertySymbol)) {
                    Object.defineProperty(this, privatePropertySymbol, {
                        value: undefined,
                        enumerable: false,
                        writable: true,
                        configurable: true
                    });
                }
                const oldValue = this[propertyKey];
                // tslint:disable-next-line:triple-equals
                if (oldValue != value) {
                    if (relationMeta.relationType === "many") {
                        const observed = new ObservableArray(value);
                        observed.register((type, items) => {
                            const changeListener: IEventDispacher<IRelationChangeEventParam> = Reflect.getOwnMetadata(relationChangeDispatherMetaKey, this);
                            if (changeListener) {
                                changeListener({ type, relation: relationMeta, entities: items });
                            }
                        });
                        value = observed;
                    }
                    if (oldSet)
                        oldSet.apply(this, value);
                    else
                        this[privatePropertySymbol] = value;
                    const changeListener: IEventDispacher<IRelationChangeEventParam> = Reflect.getOwnMetadata(relationChangeDispatherMetaKey, this.constructor);
                    if (changeListener) {
                        if (relationMeta.relationType === "many") {
                            if (oldValue && Array.isArray(oldValue) && oldValue.length > 0)
                                changeListener({ relation: relationMeta, type: "del", entities: oldValue });
                            if (value && Array.isArray(value) && value.length > 0)
                                changeListener({ relation: relationMeta, type: "add", entities: value });
                        }
                        else {
                            if (oldValue)
                                changeListener({ relation: relationMeta, type: "del", entities: [oldValue] });
                            if (value)
                                changeListener({ relation: relationMeta, type: "add", entities: [value] });
                        }
                    }
                }
            },
            get: function (this: any) {
                if (oldGet)
                    return oldGet.apply(this);
                return this[privatePropertySymbol];
            },
            configurable: true,
            enumerable: true
        };

        Object.defineProperty(target, propertyKey, descriptor);
    };
}

export class ObservableArray<T> extends Array<T> {
    protected observers: Array<(eventType: RelationChangeType, items: T[]) => void> = [];
    public constructor(items: T[]) {
        super(...items);
        Object.setPrototypeOf(this, ObservableArray.prototype);
    }
    static create<T>(items: T[]): ObservableArray<T> {
        return new ObservableArray(items);
    }
    public register(observer: (eventType: RelationChangeType, items: T[]) => void) {
        this.observers.push(observer);
    }
    public unobserve() {
        this.observers = [];
    }
    protected raiseEvents(eventType: RelationChangeType, items: T[]) {
        for (const observer of this.observers) {
            observer(eventType, items);
        }
    }
    public push(...items: T[]) {
        const result = super.push(...items);
        if (items && items.length > 0)
            this.raiseEvents("add", items);
        return result;
    }
    public pop() {
        const result = super.pop();
        if (result)
            this.raiseEvents("del", [result]);
        return result;
    }
    public shift() {
        const result = super.shift();
        if (result)
            this.raiseEvents("del", [result]);
        return result;
    }
    public unshift(...items: T[]) {
        const result = super.unshift();
        if (items && items.length > 0)
            this.raiseEvents("add", items);
        return result;
    }
    public splice(start: number, deleteCount?: number, ...items: T[]) {
        const result = super.splice(start, deleteCount, ...items);
        if (result.length > 0)
            this.raiseEvents("del", result);
        if (items && items.length > 0)
            this.raiseEvents("add", items);
        return result;
    }
    public set length(value: number) {
        this.splice(value);
    }
}