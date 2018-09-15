import { TimeSpan } from "../Data/TimeSpan";

export interface ICacheOption {
    expiredTime?: Date;
    slidingExpiration?: TimeSpan;
    tags?: string[];
}