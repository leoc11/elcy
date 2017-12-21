export class UniqueMetaData {
    public members: string[] = [];
    constructor(public name: string, ...members: string[]) {
        this.members = members;
    }
}
