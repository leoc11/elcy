
export interface ICheckConstraintOption<TE = any> {
    check: (entity: TE) => boolean;
    name?: string;
}
