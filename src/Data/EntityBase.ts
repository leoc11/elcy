import { EventListener } from "../Common/EventListener";

export abstract class EntityBase {
    public propertyChange: EventListener<EntityBase, (this: EntityBase, prop: string, oldvalue: any, newValue: any) => void>;
    public state: string;
    private _originalValues: { [key: string]: any } = {};
    public isPropertyModified(prop: string): any {
        return null;
    }
    public propertyOriValue(prop: string): any {
        return null;
    }
}