let masterFinalizers: (() => void)[] = [];
let childFinalizers: (() => void)[] = [];

export function registerRelationFinalizer(type: "master" | "child", fn: () => void) {
    if (type === "master") {
        masterFinalizers.push(fn);
    }
    else {
        childFinalizers.push(fn);
    }
}

export function finalizeRelation() {
    if (childFinalizers.length) {
        const finalizers = childFinalizers;
        childFinalizers = [];
        for (const fn of finalizers) {
            fn();
        }
    }
    if (masterFinalizers.length) {
        const finalizers = masterFinalizers;
        masterFinalizers = [];
        for (const fn of finalizers) {
            fn();
        }
    }
}
