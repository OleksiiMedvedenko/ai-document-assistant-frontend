import axios from "axios";

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong.",
) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (typeof data === "string" && data.trim()) {
      return data;
    }

    if (data && typeof data === "object") {
      const record = data as Record<string, unknown>;

      const directMessage =
        record.message ??
        record.Message ??
        record.errorMessage ??
        record.error ??
        record.title;

      if (typeof directMessage === "string" && directMessage.trim()) {
        return directMessage;
      }

      if (Array.isArray(record.errors)) {
        const first = record.errors.find(
          (item) => typeof item === "string" && item.trim(),
        );
        if (typeof first === "string") {
          return first;
        }
      }
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}
