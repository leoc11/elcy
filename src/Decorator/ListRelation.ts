import "reflect-metadata";
import { EntityMetaData } from "../MetaData/EntityMetaData";
import { ForeignKeyMetaData, MasterRelationMetaData, SlaveRelationMetaData } from "../MetaData/Relation";
import { genericType, ReferenceOption, RelationType } from "../MetaData/Types";
import { entityMetaKey, relationMetaKey } from "./DecoratorKey";
import { IRelationOption } from "./Option";

export function ListRelation<S, T>(option: IRelationOption<S, T>)
    : (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => void;
export function ListRelation<S, T>(masterType: genericType<T>, sourceKeySelectors: Array<(source: S) => any>, targetKeySelectors: Array<(source: T) => any>, masterRelationPropertySelector?: (master: T) => S[], updateOption?: ReferenceOption, deleteOption?: ReferenceOption)
    : (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => void;
export function ListRelation<S, T>(masterType: genericType<T> | IRelationOption<S, T>, sourceKeySelectors?: Array<(source: S) => any>, targetKeySelectors?: Array<(source: T) => any>, masterRelationPropertySelector?: (master: T) => S[], updateOption?: ReferenceOption, deleteOption?: ReferenceOption)
    : (target: S, propertyKey: string | symbol, descriptor: PropertyDescriptor) => void {
    let relationOption: IRelationOption<S, T>;
    if (typeof masterType === "object") {
        relationOption = masterType;
    }
    else {
        if (!sourceKeySelectors) throw new Error("sourceKeySelectors not defined");
        if (!targetKeySelectors) throw new Error("targetKeySelectors not defined");
        const relationMap: {[key in keyof S]?: keyof T } = {};

        sourceKeySelectors.forEach((o, i) => relationMap[FunctionHelper.PropertyName(o)] = FunctionHelper.PropertyName(targetKeySelectors[i]));
        relationOption = {
            deleteOption,
            masterType,
            relationMap,
            updateOption
        };
        if (masterRelationPropertySelector)
            relationOption.masterRelationProperty = FunctionHelper.PropertyName(masterRelationPropertySelector);
    }
    const targetMetaData: EntityMetaData<any> = Reflect.getOwnMetadata(entityMetaKey, relationOption.masterType);
    const targetUniqueKeys = Object.keys(targetMetaData.uniques);
    if (Object.keys(relationOption.relationMap).any((o) => !targetMetaData.primaryKeys.contains(o) && (targetUniqueKeys.length < 0 || targetUniqueKeys.all((key) => !targetMetaData.uniques[key].members.contains(o)))))
        throw new Error("Target property not valid. Target property must be a unique column");

    return (target: S, propertyKey: string /* | symbol*//*, descriptor: PropertyDescriptor*/) => {
        if (!relationOption.slaveType)
            relationOption.slaveType = target.constructor as () => S;
        if (!relationOption.name)
            relationOption.name = "FK_" + propertyKey + "_" + relationOption.slaveType.name + "_" + relationOption.masterType.name;

        const slaveMetaData: EntityMetaData<S> = Reflect.getOwnMetadata(entityMetaKey, relationOption.slaveType);
        slaveMetaData.foreignKeys[relationOption.name] = new ForeignKeyMetaData(relationOption.name, relationOption.masterType, relationOption.relationMap, relationOption.updateOption, relationOption.deleteOption);

        const slaveRelation = new SlaveRelationMetaData(relationOption.slaveType, relationOption.name, RelationType.OneToOne);
        Reflect.defineMetadata(relationMetaKey, slaveRelation, relationOption.slaveType, propertyKey);

        if (relationOption.masterRelationProperty) {
            const masterRelation = new MasterRelationMetaData(relationOption.slaveType, relationOption.masterType, relationOption.name, RelationType.OneToMany);
            Reflect.defineMetadata(relationMetaKey, masterRelation, relationOption.masterType, relationOption.masterRelationProperty);
        }
    };
}
