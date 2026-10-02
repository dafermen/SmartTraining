export class AppError extends Error {
  public constructor(
    message: string,
    public readonly statusCode = 500,
    public readonly errorCode = "INTERNAL_ERROR",
  ) {
    super(message);
    this.name = new.target.name;
  }
}
