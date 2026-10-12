# Architecture

## Components

- **API consumer:** sends HTTPS requests to API Gateway. The mobile-app icon in the diagram is conceptual; testing was performed with Postman.
- **Amazon API Gateway HTTP API:** exposes `GET /orders` and `POST /orders`.
- **Amazon Cognito:** signs users in and issues tokens.
- **JWT authorizer:** validates the token before API Gateway invokes Lambda.
- **AWS Lambda (`OrderManagementFunction`):** validates the route and processes the request.
- **Amazon DynamoDB (`Orders`):** stores order records.

## Data flow

### Create order
`Client → API Gateway → Cognito JWT validation → Lambda → DynamoDB PutItem → Client`

### Get orders
`Client → API Gateway → Cognito JWT validation → Lambda → DynamoDB GetItem/Scan → Client`

## Security status

Cognito JWT authorization is implemented and tested. AWS WAF is **not implemented**. The current API is an API Gateway HTTP API; WAF integration is listed as a future enhancement requiring a compatible architecture.
