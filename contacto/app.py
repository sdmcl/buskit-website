"""Receptor WSGI de consultas comerciales de BUSKIT."""

from collections import deque
from email.errors import HeaderParseError
from email.headerregistry import Address
from email.message import EmailMessage
from email.utils import formatdate, make_msgid
from http import HTTPStatus
from pathlib import Path
from threading import Lock
from time import monotonic
from urllib.parse import parse_qsl
from wsgiref.simple_server import WSGIRequestHandler, make_server
import json
import mimetypes
import os
import re
import smtplib
import ssl


SYSTEMS = {
    "general": "Consulta general",
    "pasajes": "Venta de pasajes",
    "klap": "Venta a bordo con KLAP",
    "convenios": "Convenios",
    "encomiendas": "Encomiendas",
    "flota": "Control de flota",
}
FIELD_NAMES = {"empresa", "correo", "sistema", "mensaje", "sitio_web"}
WINDOW = 600
attempts = deque()
limit_lock = Lock()


def mailbox(value):
    if not value.isascii() or len(value) > 254 or any(ord(c) < 33 or ord(c) == 127 for c in value):
        raise ValueError("Dirección no válida")
    try:
        address = Address(addr_spec=value)
    except (HeaderParseError, IndexError) as exc:
        raise ValueError("Dirección no válida") from exc
    if address.addr_spec != value or not address.username or len(address.username) > 64:
        raise ValueError("Dirección no válida")
    labels = address.domain.split(".")
    if len(labels) < 2 or any(not re.fullmatch(r"[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?", label) for label in labels):
        raise ValueError("Dominio no válido")
    return value


def allow_attempt(client):
    now = monotonic()
    with limit_lock:
        while attempts and attempts[0][0] <= now - WINDOW:
            attempts.popleft()
        if len(attempts) >= 40 or sum(key == client for _, key in attempts) >= 4:
            return False
        attempts.append((now, client))
        return True


def deliver(fields):
    mode = os.environ.get("BUSKIT_CONTACT_TLS", "starttls")
    if mode not in {"starttls", "tls"}:
        raise ValueError("Transporte no configurado")
    host = os.environ["BUSKIT_CONTACT_SMTP_HOST"]
    port = int(os.environ.get("BUSKIT_CONTACT_SMTP_PORT", "465" if mode == "tls" else "587"))
    if not host or not 1 <= port <= 65535:
        raise ValueError("Servidor no configurado")
    sender = mailbox(os.environ["BUSKIT_CONTACT_FROM"])
    recipient = mailbox(os.environ["BUSKIT_CONTACT_TO"])
    user = os.environ.get("BUSKIT_CONTACT_SMTP_USER")
    password = os.environ.get("BUSKIT_CONTACT_SMTP_PASSWORD")
    if bool(user) != bool(password):
        raise ValueError("Autenticación incompleta")

    message = EmailMessage()
    message["From"] = sender
    message["To"] = recipient
    message["Reply-To"] = fields["correo"]
    message["Subject"] = "Consulta comercial BUSKIT · " + SYSTEMS[fields["sistema"]]
    message["Date"] = formatdate(localtime=False)
    message["Message-ID"] = make_msgid(domain=sender.rsplit("@", 1)[1])
    message.set_content(f"Empresa: {fields['empresa']}\nCorreo: {fields['correo']}\n"
                        f"Sistema: {SYSTEMS[fields['sistema']]}\n\n{fields['mensaje']}\n")

    tls = ssl.create_default_context()
    if mode == "tls":
        relay = smtplib.SMTP_SSL(host, port, timeout=10, context=tls)
    else:
        relay = smtplib.SMTP(host, port, timeout=10)
    try:
        if mode == "starttls":
            relay.starttls(context=tls)
        if user:
            relay.login(user, password)
        refused = relay.send_message(message, from_addr=sender, to_addrs=[recipient])
        if refused:
            raise smtplib.SMTPRecipientsRefused(refused)
    finally:
        # El resultado de la entrega lo determina DATA, independientemente de QUIT.
        try:
            relay.close()
        except OSError:
            pass


def response(start, status, error=None, headers=()):
    result = {"recibida": status == HTTPStatus.OK}
    if error:
        result["error"] = error
    data = json.dumps(result, ensure_ascii=False).encode()
    start(f"{status.value} {status.phrase}", [("Content-Type", "application/json; charset=utf-8"),
          ("Content-Length", str(len(data))), ("Cache-Control", "no-store"), *headers])
    return [data]


def application(env, start):
    if env["PATH_INFO"] != "/api/contacto":
        return response(start, HTTPStatus.NOT_FOUND, "Ruta no disponible.")
    if env["REQUEST_METHOD"] != "POST":
        return response(start, HTTPStatus.METHOD_NOT_ALLOWED, "Utiliza el formulario.", [("Allow", "POST")])
    origin = os.environ.get("BUSKIT_CONTACT_ORIGIN")
    if env.get("HTTP_SEC_FETCH_SITE") == "cross-site" or (origin and env.get("HTTP_ORIGIN", origin) != origin):
        return response(start, HTTPStatus.FORBIDDEN, "Origen no admitido.")
    if env.get("CONTENT_TYPE", "").partition(";")[0].lower().strip() != "application/x-www-form-urlencoded":
        return response(start, HTTPStatus.UNSUPPORTED_MEDIA_TYPE, "Formato no admitido.")
    try:
        size = int(env.get("CONTENT_LENGTH", ""))
        if size > 48 * 1024:
            return response(start, HTTPStatus.REQUEST_ENTITY_TOO_LARGE, "La consulta es demasiado extensa.")
        if size < 1:
            raise ValueError
        raw = env["wsgi.input"].read(size)
        if len(raw) != size:
            raise ValueError
        pairs = parse_qsl(raw.decode(), keep_blank_values=True, strict_parsing=True, errors="strict", max_num_fields=5)
        values = dict(pairs)
        if len(values) != len(pairs) or set(values) - FIELD_NAMES or values.get("sitio_web"):
            raise ValueError
        fields = {key: values[key].strip() for key in ("empresa", "correo", "sistema", "mensaje")}
        mailbox(fields["correo"])
        if not 1 <= len(fields["empresa"]) <= 120 or not 1 <= len(fields["mensaje"]) <= 3000 or fields["sistema"] not in SYSTEMS:
            raise ValueError
        if any(ord(c) < 32 or ord(c) == 127 for c in fields["empresa"]):
            raise ValueError
    except (KeyError, ValueError):
        return response(start, HTTPStatus.BAD_REQUEST, "Revisa los campos del formulario.")

    client = env.get("REMOTE_ADDR", "")
    if client and client == os.environ.get("BUSKIT_CONTACT_TRUSTED_PROXY"):
        client = env.get("HTTP_X_REAL_IP") or client
    if not allow_attempt(client):
        return response(start, HTTPStatus.TOO_MANY_REQUESTS, "Espera unos minutos para volver a enviar.", [("Retry-After", str(WINDOW))])
    try:
        deliver(fields)
    except (KeyError, ValueError, OSError, smtplib.SMTPException):
        return response(start, HTTPStatus.SERVICE_UNAVAILABLE, "El servicio de contacto no está disponible. Intenta más tarde.")
    return response(start, HTTPStatus.OK)


def preview(env, start):
    path = env["PATH_INFO"]
    if path == "/api/contacto":
        return application(env, start)
    if path == "/":
        path = "/index.html"
    public_file = re.fullmatch(r"/(?:index\.html|[\w-]+\.(?:png|css|js)|assets/[\w-]+\.(?:webp|svg|woff2))", path)
    root = Path(__file__).resolve().parents[1]
    file = (root / path.lstrip("/")).resolve() if public_file else None
    if env["REQUEST_METHOD"] not in {"GET", "HEAD"} or not file or not file.is_relative_to(root) or not file.is_file():
        return response(start, HTTPStatus.NOT_FOUND, "Ruta no disponible.")
    start("200 OK", [("Content-Type", mimetypes.guess_type(file)[0] or "application/octet-stream"),
                     ("Content-Length", str(file.stat().st_size))])
    return [file.read_bytes()] if env["REQUEST_METHOD"] == "GET" else []


if __name__ == "__main__":
    class QuietHandler(WSGIRequestHandler):
        def log_message(self, *args):
            pass

    with make_server("127.0.0.1", 8080, preview, handler_class=QuietHandler) as server:
        print("BUSKIT · http://127.0.0.1:8080", flush=True)
        server.serve_forever()
