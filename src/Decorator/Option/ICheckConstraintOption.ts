
export interface ICheckConstraintOption {
    name?: string;
    check: (entity: any) => boolean;
}
