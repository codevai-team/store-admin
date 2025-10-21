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

/**
 * Создает дату в UTC, которая соответствует текущему времени в Бишкеке
 * Эта функция нужна для корректного сохранения в БД через Prisma
 * @returns Дата в UTC, которая при отображении в Бишкеке покажет правильное время
 */
export function getBishkekTimeAsUTC(): Date {
  const now = new Date();
  const bishkekTime = toBishkekTime(now);
  
  // Создаем UTC дату, которая при конвертации в Бишкек даст правильное время
  const utcTime = new Date(
    bishkekTime.getTime() - (BISHKEK_OFFSET_HOURS * 60 * 60 * 1000)
  );
  
  return utcTime;
}

/**
 * Форматирует текущее время Бишкека в ISO строку с указанием временной зоны
 * @returns Строка в формате ISO с временной зоной +06:00 для логирования
 */
export function getBishkekTimestamp(): string {
  const bishkekTime = getBishkekNow();
  const year = bishkekTime.getFullYear();
  const month = String(bishkekTime.getMonth() + 1).padStart(2, '0');
  const day = String(bishkekTime.getDate()).padStart(2, '0');
  const hours = String(bishkekTime.getHours()).padStart(2, '0');
  const minutes = String(bishkekTime.getMinutes()).padStart(2, '0');
  const seconds = String(bishkekTime.getSeconds()).padStart(2, '0');
  const milliseconds = String(bishkekTime.getMilliseconds()).padStart(3, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}+06:00`;
}
