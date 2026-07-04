export function parseApiError(error, fallbackMessage = "An unexpected error occurred.") {
  const responseData = error?.response?.data;
  const summary = responseData?.message || error?.message || fallbackMessage;
  let errors = [];

  if (responseData?.errors && typeof responseData.errors === "object") {
    errors = Object.values(responseData.errors).flat();
  }

  return {
    summary,
    errors,
  };
}
