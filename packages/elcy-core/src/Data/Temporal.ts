let Temporal: typeof import("@js-temporal/polyfill").Temporal;

try {
    Temporal = (await import('@js-temporal/polyfill')).Temporal;
}
catch { }

export { Temporal };