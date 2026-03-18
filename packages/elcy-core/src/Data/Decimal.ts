let Decimal: typeof import("decimal.js").default;

try {
    Decimal = (await import("decimal.js")).default;
}
catch { }

export { Decimal };