
export interface ICheckConstraintOption<TE = any> {
    name?: string;
    check: (entity: TE) => boolean;
}
