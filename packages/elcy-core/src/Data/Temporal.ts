import type { Temporal as TemporalModule } from "@js-temporal/polyfill";
let module: typeof import("@js-temporal/polyfill").Temporal;

try {
    module = (await import('@js-temporal/polyfill')).Temporal;
}
catch { }

export const Temporal = module;
export namespace Temporal {
    export type Instant = TemporalModule.Instant;
    export type PlainDate = TemporalModule.PlainDate;
    export type PlainTime = TemporalModule.PlainTime;
    export type PlainDateTime = TemporalModule.PlainDateTime;
    export type DurationLike = TemporalModule.DurationLike;
    export type PlainDateLike = TemporalModule.PlainDateLike;
    export type PlainTimeLike = TemporalModule.PlainTimeLike;
    export type RoundTo<T extends TemporalModule.DateTimeUnit> = TemporalModule.RoundTo<T>;
    export type SmallestUnit<T extends TemporalModule.DateTimeUnit> = TemporalModule.SmallestUnit<T>;
}

declare global {
    interface DateValueTypeRegistry {
        Temporal_PlainDate: Temporal.PlainDate;
    }
    interface TimeValueTypeRegistry {
        Temporal_PlainTime: Temporal.PlainTime;
    }
    interface DateTimeValueTypeRegistry {
        Temporal_Instant: Temporal.Instant;
    }
}
