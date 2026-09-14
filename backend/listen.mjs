import { config } from "./config.mjs";

/**
 * Start HTTP server for cPanel / CloudLinux / Passenger.
 * Standard pattern: listen(process.env.PORT || "passenger")
 * Passenger global may be undefined even when running under Passenger.
 */
export function startHttpServer(server, onReady) {
  const done = () => {
    if (onReady) onReady();
  };

  const passenger = globalThis.PhusionPassenger;
  if (passenger !== undefined) {
    try {
      passenger.configure({ autoInstall: false });
    } catch {
      /* optional */
    }
  }

  const host = config.host;
  const port = config.port;

  server.on("error", (err) => {
    console.error("[server] Failed to start:", err.message);
    process.exit(1);
  });

  console.log(
    `[server] boot env=${config.nodeEnv} PORT=${process.env.PORT ?? "unset"} PASSENGER_LISTEN_PORT=${process.env.PASSENGER_LISTEN_PORT ?? "unset"} passengerGlobal=${passenger !== undefined}`,
  );

  if (port) {
    server.listen(port, host, () => {
      console.log(`[server] Listening on ${host}:${port}`);
      done();
    });
    return;
  }

  // cPanel / Passenger default when PORT is not in env (global often missing)
  server.listen("passenger", () => {
    console.log("[server] Listening on Passenger socket");
    done();
  });
}
