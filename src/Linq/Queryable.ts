export class Queryable<TType> extends Array<TType> {
    public selects(...fn: Array<(item: TType) => any>): any[] {
        return [];
    }
}
