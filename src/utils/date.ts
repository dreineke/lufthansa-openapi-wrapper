export function validateDate(value: string, fieldName = 'date'): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${fieldName} must be in format yyyy-MM-dd`);
  }

  return value;
}

export function validateDateTime(value: string, fieldName = 'fromDateTime'): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    throw new Error(`${fieldName} must be in format yyyy-MM-ddTHH:mm`);
  }

  return value;
}
