/*
 * Minimal SMTP client for the form emails (EMAIL_PROVIDER=smtp, e.g. the client's own mail server or Gmail): one message per
 * connection, STARTTLS (port 587 / 25) or implicit TLS (port 465), AUTH PLAIN or LOGIN, UTF-8 MIME (Arabic subjects and
 * fields), text + HTML. No dependency: Node (Vercel function, local tests) uses node:net / node:tls, Cloudflare Workers use
 * cloudflare:sockets. The password is only ever sent over TLS: a server that offers no STARTTLS is refused.
 */
import type { Mail } from "./email";

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: { email: string; name?: string };
}

/** Byte pipe to the server; `upgrade` turns a plain connection into TLS (STARTTLS). */
interface Wire {
  listen(onData: (chunk: Uint8Array) => void, onEnd: (e?: Error) => void): void;
  write(s: string): Promise<void>;
  upgrade(): Promise<void>;
  close(): void;
}

const TIMEOUT_MS = 20000;
// Variable specifiers: bundlers (Vercel, wrangler, esbuild) leave them alone, each runtime loads only its own.
const load = (name: string) => import(/* @vite-ignore */ name);

export async function sendSmtp(m: Mail, c: SmtpConfig): Promise<void> {
  const implicitTls = c.port === 465;
  const isWorker =
    typeof navigator !== "undefined" &&
    navigator.userAgent === "Cloudflare-Workers";
  const wire = await (isWorker ? workerWire : nodeWire)(
    c.host,
    c.port,
    implicitTls,
  );
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      converse(wire, m, c, implicitTls),
      new Promise(
        (_, reject) =>
          (timer = setTimeout(
            () => reject(new Error("smtp timeout")),
            TIMEOUT_MS,
          )),
      ),
    ]);
  } finally {
    clearTimeout(timer);
    wire.close();
  }
}

async function converse(
  wire: Wire,
  m: Mail,
  c: SmtpConfig,
  implicitTls: boolean,
) {
  const s = new Session(wire);
  await s.expect("greeting", [220]);
  const helo = c.from.email.split("@")[1] ?? "localhost";
  let caps = await s.cmd(`EHLO ${helo}`, [250]);
  if (!implicitTls) {
    if (!caps.some((l) => /^STARTTLS\b/i.test(l)))
      throw new Error(
        "smtp server offers no STARTTLS (refusing to send the password in clear)",
      );
    await s.cmd("STARTTLS", [220]);
    await wire.upgrade();
    caps = await s.cmd(`EHLO ${helo}`, [250]);
  }
  const auth = caps.find((l) => /^AUTH[ =]/i.test(l))?.toUpperCase() ?? "";
  if (/\bPLAIN\b/.test(auth) || !/\bLOGIN\b/.test(auth)) {
    await s.cmd(`AUTH PLAIN ${b64(`\0${c.user}\0${c.pass}`)}`, [235], "AUTH");
  } else {
    await s.cmd("AUTH LOGIN", [334]);
    await s.cmd(b64(c.user), [334], "AUTH");
    await s.cmd(b64(c.pass), [235], "AUTH");
  }
  await s.cmd(`MAIL FROM:<${c.from.email}>`, [250]);
  for (const to of m.to) await s.cmd(`RCPT TO:<${to}>`, [250, 251], "RCPT");
  await s.cmd("DATA", [354]);
  // Dot-stuffing (RFC 5321 4.5.2); the base64 bodies never start a line with "." but headers could in theory.
  await s.cmd(
    `${message(m, c.from, helo).replace(/^\./gm, "..")}\r\n.`,
    [250],
    "DATA",
  );
  await wire.write("QUIT\r\n").catch(() => {});
}

/** Reads replies ("250-a", "250 b" = one reply) and sends commands. */
class Session {
  private buf = "";
  private ended: Error | null = null;
  private wake: (() => void) | null = null;
  private dec = new TextDecoder();
  constructor(private wire: Wire) {
    wire.listen(
      (chunk) => {
        this.buf += this.dec.decode(chunk, { stream: true });
        this.wake?.();
      },
      (e) => {
        this.ended = e ?? new Error("smtp connection closed");
        this.wake?.();
      },
    );
  }
  private async reply(): Promise<{ code: number; lines: string[] }> {
    const lines: string[] = [];
    for (;;) {
      const i = this.buf.indexOf("\r\n");
      if (i < 0) {
        if (this.ended) throw this.ended;
        await new Promise<void>((r) => (this.wake = r));
        this.wake = null;
        continue;
      }
      const line = this.buf.slice(0, i);
      this.buf = this.buf.slice(i + 2);
      lines.push(line.slice(4));
      if (/^\d{3}(?: |$)/.test(line))
        return { code: Number(line.slice(0, 3)), lines };
    }
  }
  async expect(what: string, codes: number[]) {
    const r = await this.reply();
    if (!codes.includes(r.code))
      throw new Error(`smtp ${what} ${r.code} ${r.lines.at(-1) ?? ""}`.trim());
    return r.lines;
  }
  /** `label` replaces the command in error messages (never log AUTH payloads). */
  async cmd(line: string, codes: number[], label?: string) {
    await this.wire.write(`${line}\r\n`);
    return this.expect(label ?? line.split(" ")[0], codes);
  }
}

/* ───────── MIME message ───────── */
const clean = (s: string) => s.replace(/[\r\n]+/g, " ").trim(); // no header injection
const ascii = (s: string) => /^[\x20-\x7e]*$/.test(s);

function message(m: Mail, from: SmtpConfig["from"], domain: string): string {
  const boundary = `=_ch_${crypto.randomUUID()}`;
  const fromName = from.name ? `${word(from.name)} ` : "";
  const headers = [
    `From: ${fromName}<${from.email}>`,
    `To: ${m.to.map(clean).join(", ")}`,
    ...(m.replyTo ? [`Reply-To: <${clean(m.replyTo)}>`] : []),
    `Subject: ${word(m.subject)}`,
    `Date: ${new Date().toUTCString().replace("GMT", "+0000")}`,
    `Message-ID: <${crypto.randomUUID()}@${domain}>`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ];
  const part = (type: string, body: string) =>
    [
      `--${boundary}`,
      `Content-Type: ${type}; charset=UTF-8`,
      "Content-Transfer-Encoding: base64",
      "",
      wrap(b64(body)),
    ].join("\r\n");
  return [
    ...headers,
    "",
    part("text/plain", m.text),
    part("text/html", m.html),
    `--${boundary}--`,
  ].join("\r\n");
}

/** Header text: as is when plain ASCII, else RFC 2047 encoded words (<= 75 chars each, never splitting a character). */
function word(s: string): string {
  s = clean(s);
  if (ascii(s)) return s;
  const words: string[] = [];
  let chunk = "";
  for (const ch of s) {
    if (new TextEncoder().encode(chunk + ch).length > 45) {
      words.push(chunk);
      chunk = "";
    }
    chunk += ch;
  }
  if (chunk) words.push(chunk);
  return words.map((w) => `=?UTF-8?B?${b64(w)}?=`).join("\r\n ");
}

function b64(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000)
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
const wrap = (s: string) => s.replace(/.{1,76}/g, "$&\r\n").trimEnd();

/* ───────── Connections ───────── */
type NodeSocket = {
  on(ev: string, cb: (x?: any) => void): void;
  once(ev: string, cb: (x?: any) => void): void;
  removeAllListeners(ev?: string): void;
  write(s: string, cb: (e?: Error | null) => void): void;
  destroy(): void;
};

async function nodeWire(
  host: string,
  port: number,
  implicitTls: boolean,
): Promise<Wire> {
  const net = await load("node:net");
  const tls = await load("node:tls");
  const ready = (sock: NodeSocket, ev: string) =>
    new Promise<NodeSocket>((resolve, reject) => {
      sock.once(ev, () => resolve(sock));
      sock.once("error", reject);
    });
  let sock: NodeSocket = implicitTls
    ? await ready(
        tls.connect({ host, port, servername: host }),
        "secureConnect",
      )
    : await ready(net.connect({ host, port }), "connect");
  let onData: (c: Uint8Array) => void = () => {};
  let onEnd: (e?: Error) => void = () => {};
  const attach = (s: NodeSocket) => {
    s.on("data", (d) => onData(d));
    s.on("error", (e) => onEnd(e));
    s.on("close", () => onEnd());
  };
  return {
    listen(d, e) {
      onData = d;
      onEnd = e;
      attach(sock);
    },
    write: (s) =>
      new Promise((resolve, reject) =>
        sock.write(s, (e) => (e ? reject(e) : resolve())),
      ),
    async upgrade() {
      for (const ev of ["data", "error", "close"]) sock.removeAllListeners(ev);
      sock = await ready(
        tls.connect({ socket: sock, servername: host }),
        "secureConnect",
      );
      attach(sock);
    },
    close: () => sock.destroy(),
  };
}

// Cloudflare Workers (the Pages Functions target): https://developers.cloudflare.com/workers/runtime-apis/tcp-sockets/
async function workerWire(
  host: string,
  port: number,
  implicitTls: boolean,
): Promise<Wire> {
  const { connect } = await load("cloudflare:sockets");
  let sock = connect(
    { hostname: host, port },
    { secureTransport: implicitTls ? "on" : "starttls" },
  );
  let writer = sock.writable.getWriter();
  let reader: ReadableStreamDefaultReader<Uint8Array>;
  let upgrading = false;
  let onData: (c: Uint8Array) => void = () => {};
  let onEnd: (e?: Error) => void = () => {};
  const pump = async () => {
    reader = sock.readable.getReader();
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        onData(value);
      }
      if (!upgrading) onEnd();
    } catch (e) {
      if (!upgrading)
        onEnd(e instanceof Error ? e : new Error("smtp read failed"));
    }
  };
  const enc = new TextEncoder();
  return {
    listen(d, e) {
      onData = d;
      onEnd = e;
      void pump();
    },
    write: (s) => writer.write(enc.encode(s)),
    async upgrade() {
      upgrading = true;
      reader.releaseLock();
      writer.releaseLock();
      sock = sock.startTls();
      writer = sock.writable.getWriter();
      upgrading = false;
      void pump();
    },
    close: () => void sock.close().catch(() => {}),
  };
}
