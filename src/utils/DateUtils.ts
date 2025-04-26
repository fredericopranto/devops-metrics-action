export enum TimeUnit {
  Day = 'day',
  Week = 'week',
  Month = 'month',
  Year = 'year'
}

export function addTime(date: Date, amount: number, unit: TimeUnit): Date {
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