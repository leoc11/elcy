import { TimeSpan } from "../Common/TimeSpan";

export interface ICacheOption {
    expiredTime?: Date;
    slidingExpiration?: TimeSpan;
    tags?: string[];
}
