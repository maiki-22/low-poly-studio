import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "node:child_process";

const root = resolve(process.env.DEHECHO_BACKEND_DIR ?? ".local/DeHecho");
const python = resolve(root, process.platform === "win32" ? ".venv/Scripts/python.exe" : ".venv/bin/python");
if (!existsSync(resolve(root, "main.py")) || !existsSync(python)) {
  console.error("Prepara la API DeHecho y su entorno .venv en .local/DeHecho, o define DEHECHO_BACKEND_DIR. Consulta README.md.");
  process.exit(1);
}
const child = spawn(python, ["-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8000"], { cwd: root, stdio: "inherit" });
child.on("error", (error) => { console.error(error.message); process.exitCode = 1; });
child.on("exit", (code) => { process.exitCode = code ?? 0; });
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
