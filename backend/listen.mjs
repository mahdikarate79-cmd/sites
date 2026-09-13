import { config } from "./config.mjs";

/**
 * Start HTTP server — cPanel / CloudLinux uses Phusion Passenger (no process.env.PORT).
 * Standalone Node uses PORT / PASSENGER_LISTEN_PORT when set.
 */
export function startHttpServer(server, onReady) {
  server.on("error", (err) => {
    console.error("[server] Failed to start:", err.message);
    process.exit(1);
  });

  const done = () => {
    if (onReady) onReady();
  };

  const passenger = globalThis.PhusionPassenger;
  if (passenger !== undefined) {
    passenger.configure({ autoInstall: false });
    server.listen("passenger", () => {
      console.log("[server] Listening via Phusion Passenger");
      done();
    });
    return;
  }

  const host = config.host;
  const port = config.port;

  if (port) {
    server.listen(port, host, () => {
      console.log(`[server] Listening on ${host}:${port}`);
      done();
    });
    return;
  }

  const passengerPort = process.env.PASSENGER_LISTEN_PORT;
  if (passengerPort) {
    const p = Number(passengerPort);
    server.listen(p, host, () => {
      console.log(`[server] Listening on Passenger port ${p}`);
      done();
    });
    return;
  }

  if (config.nodeEnv !== "production") {
    server.listen(8787, host, () => {
      console.log(`[server] Development fallback http://${host}:8787`);
      done();
    });
    return;
  }

  console.error("[server] No PORT and not running under Passenger — cannot start in production");
  process.exit(1);
}
