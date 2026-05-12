FROM golang:1.22-alpine AS builder

WORKDIR /app
COPY agent/go.mod agent/go.sum ./
RUN go mod download
COPY agent/ .
RUN CGO_ENABLED=0 GOOS=linux go build -o /agent ./cmd/agent

FROM alpine:3.19

RUN apk add --no-cache ca-certificates tzdata
COPY --from=builder /agent /usr/local/bin/agent

ENTRYPOINT ["agent"]
