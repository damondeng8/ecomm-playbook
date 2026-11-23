// apps/api/src/index.ts: the whole API as one fetch handler. No router framework.
import { auth } from "./auth";
import { getProduct, listProducts } from "./catalog";
import { getCart, updateCart } from "./cart";
import { createCheckout, handleStripeWebhook, orderForVisitor } from "./orders";
import { handleUnsubscribe, subscribe } from "./email";
import { assignments } from "./experiments";
import { enqueueEvents, track } from "./events";
import { visitorFrom } from "./visitor";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    try {
      if (url.pathname.startsWith("/api/auth/")) return auth.handler(request);

      // A first-party visitor id on every request: cart, events, and experiments hang off it.
      const visitor = await visitorFrom(request, env);

      switch (`${request.method} ${url.pathname}`) {
        case "GET /health":
          return Response.json({ ok: true });
        case "POST /webhooks/stripe":
          return handleStripeWebhook(request, env, ctx); // verified signature; the only writer of `orders`
        case "POST /events":
          return enqueueEvents(request, env, visitor);
        case "GET /products":
          return Response.json(await listProducts(env));
        case "GET /product":
          return Response.json(await getProduct(env, url.searchParams.get("slug")));
        case "GET /experiments":
          return visitor.respond(await assignments(env, visitor)); // sticky arms, weights from KV
        case "GET /cart":
          return visitor.respond(await getCart(env, visitor));
        case "POST /cart":
          return visitor.respond(await updateCart(request, env, visitor)); // server computes every price
        case "POST /checkout":
          return visitor.respond(await createCheckout(request, env, visitor)); // Stripe session from the server-side cart
        case "GET /order":
          return visitor.respond(await orderForVisitor(env, visitor, url.searchParams.get("session")));
        case "POST /subscribe":
          return subscribe(request, env, visitor); // records consent, Turnstile-checked
        case "GET /unsubscribe":
        case "POST /unsubscribe":
          return handleUnsubscribe(request, env); // signed token is the auth; one click, no login
      }
      return Response.json({ error: "not_found" }, { status: 404 });
    } catch (err) {
      // Errors go to Tinybird with every other event. No separate error tracker.
      ctx.waitUntil(track(env, "error", {
        source: "api",
        route: url.pathname,
        message: String(err),
        stack: err instanceof Error ? err.stack : undefined,
      }));
      return Response.json({ error: "internal" }, { status: 500 });
    }
  },

  // Lists sync, automations, and scheduled sends run here (the ecomm-email skill).
  async scheduled(controller, env, ctx) {},
} satisfies ExportedHandler<Env>;
