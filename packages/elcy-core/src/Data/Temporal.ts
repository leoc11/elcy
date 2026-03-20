import type { Temporal as TemporalModule } from "@js-temporal/polyfill";
let module: typeof import("@js-temporal/polyfill").Temporal;

try {
    module = (await import('@js-temporal/polyfill')).Temporal;
}
catch { }

export const Temporal = module;
export namespace Temporal {
    export type DurationLike = TemporalModule.DurationLike;
    export type PlainDateLike = TemporalModule.PlainDateLike;
    export type PlainTimeLike = TemporalModule.PlainTimeLike;
    export type RoundTo<T extends TemporalModule.DateTimeUnit> = TemporalModule.RoundTo<T>;
}