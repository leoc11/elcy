import { genericType } from "../MetaData/Types";

export class Test {
    public prop1: string;
}

export function Relation<S, T, SK extends (source: S) => any>(masterType: genericType<T>, relationMaps: { [sourceKeySelector: SK]: (source: T) => K }, targetKeySelector: (source: T) => K, backRelation?: (target: T) => S[] | S):
    (target: S, propertyKey: string | symbol, descriptor: PropertyDescriptor) => void {
    const sourceProperty = sourceKeySelector.toString();
    const targetProperty = targetKeySelector.toString();
    let backRelationName = "";
    if (backRelation)
        backRelationName = backRelation.toString();

}