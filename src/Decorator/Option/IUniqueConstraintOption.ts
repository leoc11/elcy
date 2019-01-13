import { PropertySelector } from "../../Common/Type";

export interface IUniqueConstraintOption<TE = any> {
    name?: string;
    properties?: Array<PropertySelector<TE>>;
}
