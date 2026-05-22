export class ApiKeyMissingError extends Error {
  constructor() {
    super('ANTHROPIC_API_KEY is not configured');
    this.name = 'ApiKeyMissingError';
  }
}

export class ApiResponseError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiResponseError';
  }
}

export class ParseError extends Error {
  constructor(
    message: string,
    public raw: string,
  ) {
    super(message);
    this.name = 'ParseError';
  }
}
