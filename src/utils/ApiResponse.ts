class ApiResponse<T = unknown> {
  statusCode: number;
  data: T;
  message?: string;
  success: boolean;

  constructor(statusCode: number, data: T, message?: string) {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message || (statusCode < 400 ? "Success" : "Error");
    this.success = statusCode < 400;
  }
}

export { ApiResponse };
