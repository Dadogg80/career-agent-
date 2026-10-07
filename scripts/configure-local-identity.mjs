import { randomBytes } from "node:crypto";
import { existsSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const target = process.argv.find(value => value.startsWith("--output="))?.slice(9) ?? resolve(root, "apps/backend/.env.identity");
if (existsSync(target)) {
  console.info("Identity configuration already exists; it was left unchanged.");
} else {
  const settings = [
    `PILOT_LOGIN_PASSWORD=${randomBytes(24).toString("base64url")}`,
    `KEYCLOAK_ADMIN_PASSWORD=${randomBytes(24).toString("base64url")}`,
    "OIDC_ISSUER_URI=http://127.0.0.1:8081/realms/career-agent",
    "OIDC_CLIENT_ID=career-agent",
    "BACKEND_PUBLIC_ORIGIN=http://127.0.0.1:8080",
    "OIDC_REDIRECT_URI=http://127.0.0.1:8080/login/oauth2/code/career",
    "FRONTEND_ORIGIN=http://127.0.0.1:3000",
  ];
  writeFileSync(target, settings.join("\n") + "\n", { mode: 0o600, flag: "wx" });
  console.info("Local identity configuration created with generated credentials. No credentials were printed. Pilot username: pilot.");
}
