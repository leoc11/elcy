import { IQueryOption } from "./IQueryOption";
import { ICacheOption } from "../../Cache/ICacheOption";
export interface ISelectCacheOption extends ICacheOption {
    disableEntityAsTag?: boolean;
}
export interface ISelectQueryOption extends IQueryOption {
    resultCache?: "none" | ISelectCacheOption;
}