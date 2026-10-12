import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.ORDERS_TABLE || "Orders";

const response = (statusCode, body) => ({
  statusCode,
  headers: {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
  },
  body: JSON.stringify(body),
});

export const handler = async (event) => {
  try {
    const method =
      event?.requestContext?.http?.method || event?.httpMethod || "";
    const path = event?.rawPath || event?.path || "/orders";
    const query = event?.queryStringParameters || {};

    if (path.endsWith("/orders") && method === "GET") {
      if (query.orderId) {
        const result = await dynamodb.send(
          new GetCommand({
            TableName: TABLE_NAME,
            Key: { orderId: query.orderId },
          })
        );

        if (!result.Item) {
          return response(404, { message: "Order not found" });
        }
        return response(200, result.Item);
      }

      const result = await dynamodb.send(
        new ScanCommand({
          TableName: TABLE_NAME,
          Limit: 50,
        })
      );
      return response(200, result.Items || []);
    }

    if (path.endsWith("/orders") && method === "POST") {
      let body;
      try {
        body =
          typeof event.body === "string"
            ? JSON.parse(event.body)
            : event.body || {};
      } catch {
        return response(400, { message: "Request body must be valid JSON" });
      }

      const orderId =
        typeof body.orderId === "string" ? body.orderId.trim() : "";
      const item = typeof body.item === "string" ? body.item.trim() : "";

      if (!orderId || !item) {
        return response(400, {
          message: "Both orderId and item are required",
        });
      }

      const order = {
        orderId,
        item,
        status: "PLACED",
        createdAt: new Date().toISOString(),
      };

      try {
        await dynamodb.send(
          new PutCommand({
            TableName: TABLE_NAME,
            Item: order,
            ConditionExpression: "attribute_not_exists(orderId)",
          })
        );
      } catch (error) {
        if (error?.name === "ConditionalCheckFailedException") {
          return response(409, { message: "Order ID already exists" });
        }
        throw error;
      }

      return response(201, order);
    }

    return response(404, { message: "Route not found" });
  } catch (error) {
    console.error("Order API error:", error);
    return response(500, { message: "Internal server error" });
  }
};
