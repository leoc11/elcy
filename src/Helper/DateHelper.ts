export const DateHelper = {
    toFormat(date: Date, format: string): string {
        return format.replace(/dd/ig, this.toFill(date.getDate()));
    },
    toFill(num: number): string {
        return (num > 10) ? num.toString() : ("0" + num).slice(-2);
    }
};
