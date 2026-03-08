import { DeleteMode } from "../../Common/StringType";

export interface IDeleteEventParam {
    // TODO: maybe change to isForceHardDelete
    type: DeleteMode;
}
