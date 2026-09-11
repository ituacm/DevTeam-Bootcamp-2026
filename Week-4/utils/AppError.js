// Beklediğimiz hatalar için tek bir tip: yanında HTTP durum kodunu taşır.
export default class AppError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.details = details;
  }
}

export const badRequest = (message, details) => new AppError(400, message, details);
export const notFound = (message = "Not Found") => new AppError(404, message);
export const conflict = (message) => new AppError(409, message);
