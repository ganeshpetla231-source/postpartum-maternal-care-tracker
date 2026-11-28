export function okResponse(data, message = 'Request successful') {
  return {
    success: true,
    data,
    message
  };
}

export function errorResponse(message, errors = []) {
  return {
    success: false,
    message,
    errors
  };
}
