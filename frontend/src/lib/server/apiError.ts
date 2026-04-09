import { NextResponse } from "next/server";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export function handleApiError(err: unknown) {
  if (err instanceof ApiError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  if (err instanceof Response) {
    return err;
  }
  const message = err instanceof Error ? err.message : "Internal Server Error";
  return NextResponse.json({ error: message }, { status: 500 });
}
