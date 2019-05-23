import { PropertySelector } from "../../Common/Type";

export interface IIndexOption<TE = any> {
    name?: string;
    unique?: boolean;
    properties?: Array<PropertySelector<TE>>;
}
