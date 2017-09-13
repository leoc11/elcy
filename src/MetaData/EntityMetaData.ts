export class EntityMetaData<T> {
    public hasInheritance: boolean;
    public primaryKeys: string[];
    public deleteProperty: string;
    public createDateProperty: string;
    public modifiedProperty: string;
    public members: string[];
    public table: string;
    public defaultOrder: (item: T) => any;
    constructor(public type: { new(): T }) {
    }
}
