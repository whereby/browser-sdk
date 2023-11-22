interface Range {
    low: number;
    high: number;
}
const RemapNumber =
    ({ from: { low: fromLow, high: fromHigh }, to: { low: toLow, high: toHigh } }: { from: Range; to: Range }) =>
    (value: number) => {
        const mapped = ((value - fromLow) * (toHigh - toLow)) / (fromHigh - fromLow) + toLow;
        return Math.max(Math.min(mapped, toHigh), toLow);
    };

export default RemapNumber;
