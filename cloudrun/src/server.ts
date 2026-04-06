import { createServer, type IncomingMessage, type ServerResponse } from "node:http"

import type { DailyGenerateRequest, WeeklyGenerateRequest } from "./types/report"
import { generateDailyRoute, validateDailyRequest } from "./routes/daily-generate"
import { generateWeeklyRoute, validateWeeklyRequest } from "./routes/weekly-generate"

export interface HttpRequestInput {
  method: string
  path: string
  body?: string
}

export interface HttpResponseOutput {
  statusCode: number
  headers?: Record<string, string>
  body: string
}

function jsonResponse(statusCode: number, payload: unknown): HttpResponseOutput {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8"
    },
    body: JSON.stringify(payload)
  }
}

function parseJsonBody(body?: string): unknown {
  if (!body) {
    return {}
  }

  return JSON.parse(body)
}

export async function handleHttpRequest(input: HttpRequestInput): Promise<HttpResponseOutput> {
  if (input.method === "GET" && input.path === "/healthz") {
    return jsonResponse(200, {
      ok: true,
      service: "daily-weekly-report-generator-cloudrun"
    })
  }

  if (input.method === "POST" && input.path === "/api/reports/daily/generate") {
    const requestBody = parseJsonBody(input.body)
    const requestError = validateDailyRequest(requestBody)

    if (requestError) {
      return jsonResponse(400, { error: requestError })
    }

    const result = generateDailyRoute(requestBody as DailyGenerateRequest)

    if (!result.validation.valid || !result.document) {
      return jsonResponse(422, {
        error: result.validation.reason ?? "generated payload is invalid"
      })
    }

    return jsonResponse(200, {
      document: result.document
    })
  }

  if (input.method === "POST" && input.path === "/api/reports/weekly/generate") {
    const requestBody = parseJsonBody(input.body)
    const requestError = validateWeeklyRequest(requestBody)

    if (requestError) {
      return jsonResponse(400, { error: requestError })
    }

    const result = generateWeeklyRoute(requestBody as WeeklyGenerateRequest)

    if (!result.validation.valid || !result.document) {
      return jsonResponse(422, {
        error: result.validation.reason ?? "generated payload is invalid"
      })
    }

    return jsonResponse(200, {
      document: result.document
    })
  }

  return jsonResponse(404, {
    error: "not found"
  })
}

async function readRequestBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = []

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }

  return Buffer.concat(chunks).toString("utf8")
}

function writeNodeResponse(response: ServerResponse, payload: HttpResponseOutput): void {
  Object.entries(payload.headers ?? {}).forEach(([name, value]) => {
    response.setHeader(name, value)
  })

  response.statusCode = payload.statusCode
  response.end(payload.body)
}

export function startServer(port = Number(process.env.PORT || "8080")) {
  const server = createServer(async (request, response) => {
    try {
      const body = await readRequestBody(request)
      const payload = await handleHttpRequest({
        method: request.method ?? "GET",
        path: request.url ?? "/",
        body
      })
      writeNodeResponse(response, payload)
    } catch (error) {
      writeNodeResponse(
        response,
        jsonResponse(500, {
          error: error instanceof Error ? error.message : "unexpected server error"
        })
      )
    }
  })

  server.listen(port)
  return server
}

if (require.main === module) {
  startServer()
}
