import { ICacheOption } from "./ICacheOption";

export interface ICacheItem<T = any> extends ICacheOption {
    data: T;
    key?: string;
}
