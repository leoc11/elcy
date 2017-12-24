import { genericType, ReferenceOption } from "../../Common/Type";

export interface IRelationOption<TSlave, TMaster> {
    slaveType?: genericType<TSlave>;
    masterType: genericType<TMaster>;
    relationMap: {[key in keyof TSlave]?: keyof TMaster};
    name?: string;
    updateOption?: ReferenceOption;
    deleteOption?: ReferenceOption;
    masterRelationProperty?: string;
}
