
export interface IUniqueConstraintOption<T = any> {
    name?: string;
    properties?: Array<keyof T>;
}
