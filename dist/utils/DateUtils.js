export var TimeUnit;
(function (TimeUnit) {
    TimeUnit["Day"] = "day";
    TimeUnit["Week"] = "week";
    TimeUnit["Month"] = "month";
    TimeUnit["Year"] = "year";
})(TimeUnit || (TimeUnit = {}));
export function addTime(date, amount, unit) {
    const newDate = new Date(date);
    switch (unit) {
        case TimeUnit.Day:
            newDate.setDate(newDate.getDate() + amount);
            break;
        case TimeUnit.Week:
            newDate.setDate(newDate.getDate() + amount * 7);
            break;
        case TimeUnit.Month:
            newDate.setMonth(newDate.getMonth() + amount);
            break;
        case TimeUnit.Year:
            newDate.setFullYear(newDate.getFullYear() + amount);
            break;
    }
    return newDate;
}
//# sourceMappingURL=DateUtils.js.map