import { pbkdf2Sync, randomBytes } from "node:crypto";

const ITERATIONS = 600_000;

function readHidden(prompt) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error("Execute este comando em um terminal interativo.");
  }

  return new Promise((resolve, reject) => {
    let value = "";
    const stdin = process.stdin;

    function restore() {
      stdin.off("data", onData);
      stdin.setRawMode(false);
      stdin.pause();
    }

    function onData(chunk) {
      for (const character of String(chunk)) {
        if (character === "\u0003") {
          restore();
          process.stdout.write("\n");
          reject(new Error("Operação cancelada."));
          return;
        }
        if (character === "\r" || character === "\n") {
          restore();
          process.stdout.write("\n");
          resolve(value);
          return;
        }
        if (character === "\u007f" || character === "\b") {
          if (value) {
            value = value.slice(0, -1);
            process.stdout.write("\b \b");
          }
          continue;
        }
        if (character >= " ") {
          value += character;
          process.stdout.write("*");
        }
      }
    }

    process.stdout.write(prompt);
    stdin.setEncoding("utf8");
    stdin.setRawMode(true);
    stdin.resume();
    stdin.on("data", onData);
  });
}

if (process.argv.length > 2) {
  throw new Error(
    "Não informe a senha na linha de comando; ela será solicitada com segurança.",
  );
}

const password = await readHidden("Digite a senha do administrador: ");
const confirmation = await readHidden("Repita a senha: ");

if (password !== confirmation) {
  throw new Error("As senhas informadas não coincidem.");
}
if (password.length < 12 || password.length > 512) {
  throw new Error("Use uma senha com 12 a 512 caracteres.");
}

const salt = randomBytes(16);
const hash = pbkdf2Sync(password, salt, ITERATIONS, 32, "sha256");
const encoded = [
  "pbkdf2-sha256",
  String(ITERATIONS),
  salt.toString("base64url"),
  hash.toString("base64url"),
].join("$");

process.stdout.write(
  `\nCopie somente o hash abaixo para ADMIN_PASSWORD_HASH:\n${encoded}\n`,
);
