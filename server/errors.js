// An error that maps directly to an HTTP status and a stable error code the client understands.
export class ApiError extends Error {
  constructor(status, code, message = code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
