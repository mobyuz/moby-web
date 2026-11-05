import { createServer } from "node:http";
import process from "node:process";

const usedTokens = new Set();

createServer(async (request, response) => {
  const respond = (status, body) => {
    response.writeHead(status, { "Content-Type": "application/json" });
    response.end(JSON.stringify(body));
  };
  if (request.method !== "POST" || request.url !== "/v1/demo/chat") {
    respond(404, {});
    return;
  }

  let body = "";
  request.setEncoding("utf8");
  for await (const chunk of request) body += chunk;
  const { text, bot_token: token } = JSON.parse(body);
  if (!token?.startsWith("test-") || usedTokens.has(token)) {
    respond(403, { code: "bot_verification_failed" });
    return;
  }
  usedTokens.add(token);
  if (text === "Trigger the limit") {
    respond(429, { code: "rate_limited" });
  } else {
    respond(200, { reply: "Hello from the Moby API test server." });
  }
}).listen(Number(process.argv[2]), "127.0.0.1");
