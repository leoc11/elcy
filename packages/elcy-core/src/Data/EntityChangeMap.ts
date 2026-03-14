import { EntityEntryMap } from "./EntityEntryMap";

export class EntityChangeMap {
    public add = new EntityEntryMap();
    public update = new EntityEntryMap();
    public delete = new EntityEntryMap();

    public hasChanges() {
        return !this.add.empty() || !this.update.empty() || !this.delete.empty();
    }
    public reset() {
        this.add.clear();
        this.update.clear();
        this.delete.clear();
    }
}
