export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export const successResponse = <T>(
  message: string,
  data?: T,
): ApiResponse<T> => ({
  success: true,
  message,
  data,
});

export const errorResponse = (message: string): ApiResponse => ({
  success: false,
  message,
});
