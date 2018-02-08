export abstract class EntityBase {
    public state: string;
    public isPropertyModified(prop: string): any {
        return null;
    }
    public propertyOriValue(prop: string): any {
        return null;
    }
}