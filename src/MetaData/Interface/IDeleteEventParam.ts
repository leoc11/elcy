import { DeleteStrategy } from "../../Common/Type";

export interface IDeleteEventParam {
    // TODO: maybe change to isForceHardDelete
    type: DeleteStrategy;
}
