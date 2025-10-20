/**
 * Утилиты для работы с временной зоной Бишкека (UTC+6)
 */

const BISHKEK_OFFSET_HOURS = 6;

/**
 * Конвертирует дату в время Бишкека (UTC+6)
 * @param date - Дата для конвертации
 * @returns Дата в временной зоне Бишкека
 */
export function toBishkekTime(date: Date): Date {
  const bishkekOffset = BISHKEK_OFFSET_HOURS * 60; // 6 часов в минутах
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  return new Date(utc + (bishkekOffset * 60000));
}

/**
 * Форматирует дату в строку YYYY-MM-DD с учетом времени Бишкека
 * @param date - Дата для форматирования
 * @returns Строка в формате YYYY-MM-DD
 */
export function formatBishkekDate(date: Date): string {
  const bishkekDate = toBishkekTime(date);
  return `${bishkekDate.getFullYear()}-${String(bishkekDate.getMonth() + 1).padStart(2, '0')}-${String(bishkekDate.getDate()).padStart(2, '0')}`;
}

/**
 * Создает строку даты и времени с указанием временной зоны Бишкека
 * @param date - Дата в формате YYYY-MM-DD
 * @param time - Время в формате HH:MM или HH:MM:SS
 * @returns Строка в формате ISO с временной зоной +06:00
 */
export function createBishkekDateTime(date: string, time: string): string {
  if (!date) return '';
  const timeWithSeconds = time.includes(':') && time.split(':').length === 2 ? `${time}:00` : time;
  return `${date}T${timeWithSeconds}+06:00`;
}

/**
 * Получает текущее время в Бишкеке
 * @returns Текущая дата в временной зоне Бишкека
 */
export function getBishkekNow(): Date {
  return toBishkekTime(new Date());
}

/**
 * Создает диапазон дат для последних N дней в временной зоне Бишкека
 * @param days - Количество дней (по умолчанию 7)
 * @returns Массив дат за последние N дней
 */
export function getLastNDaysInBishkek(days: number = 7): Date[] {
  const today = getBishkekNow();
  const result = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    result.push(day);
  }
  
  return result;
}
