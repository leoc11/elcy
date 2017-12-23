import { genericType, ReferenceOption } from "../../MetaData/Types";

export interface IRelationOption<TSlave, TMaster> {
    slaveType?: genericType<TSlave>;
    masterType: genericType<TMaster>;
    relationMap: {[key in keyof TSlave]?: keyof TMaster};
    name?: string;
    updateOption?: ReferenceOption;
    deleteOption?: ReferenceOption;
    masterRelationProperty?: string;
}
