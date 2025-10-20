// Глобальное хранилище кодов верификации
class VerificationCodeStore {
  private codes = new Map<string, { code: string, timestamp: number }>();

  set(login: string, data: { code: string, timestamp: number }) {
    this.codes.set(login, data);
  }

  get(login: string) {
    const data = this.codes.get(login);
    return data;
  }

  delete(login: string) {
    this.codes.delete(login);
  }

  cleanup() {
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    for (const [login, data] of this.codes.entries()) {
      if (now - data.timestamp > fiveMinutes) {
        this.codes.delete(login);
      }
    }
  }

  // Метод для отладки
  getAllCodes() {
    return Array.from(this.codes.entries());
  }
}

// Создаем глобальный экземпляр
const verificationCodes = new VerificationCodeStore();

export { verificationCodes };
