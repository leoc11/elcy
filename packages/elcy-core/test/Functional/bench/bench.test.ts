import { describe, expect, test } from "bun:test";

describe("Benchmark", () => {
    test("cold start process", async () => {
        const start = performance.now();
        const proc = Bun.spawn(["bun", "run", "./fixture/coldstart.ts"], {
            cwd: import.meta.dir,
            stdout: "inherit",
            stderr: "inherit",
            env: {
                BUN_ENV: "test"
            }
            // lazy: true
        });
        await proc.exited;
        const avgTimes = performance.now() - start;
        console.log(avgTimes);
        expect(avgTimes).toBeLessThan(400);
    });
    test("cold start", async () => {
        const start = performance.now();
        await import("./fixture/coldstart.minimal");
        const avgTimes = performance.now() - start;
        console.log(avgTimes);
        expect(avgTimes).toBeLessThan(100);
    });
    test("cold start all", async () => {
        const start = performance.now();
        await import("./fixture/coldstart");
        const avgTimes = performance.now() - start;
        console.log(avgTimes);
        expect(avgTimes).toBeLessThan(250);
    });
});