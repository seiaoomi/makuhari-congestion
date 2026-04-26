declare module 'japanese-holidays' {
  function isHoliday(date: Date): string | undefined;
  function getHolidaysOf(year: number, month?: number): { month: number; date: number; name: string }[];
}
