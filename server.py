#!/usr/bin/env python3
"""Serve the site and deliver dealership applications over SMTP."""
import json
import html
import os
import re
import smtplib
import ssl
from pathlib import Path
from urllib.parse import unquote, urlsplit
from email.message import EmailMessage
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

FIELDS = {'store': 200, 'name': 200, 'phone': 80, 'email': 254, 'city': 100, 'type': 100, 'note': 4000}
TYPES = {'Spor perakende', 'Ayakkabı mağazası', 'Outdoor / koşu mağazası', 'Diğer'}


class Handler(SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path != '/api/dealer':
            self.send_error(404)
            return
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if length <= 0 or length > 12000:
                raise ValueError('Invalid request size')
            data = json.loads(self.rfile.read(length))
            if not isinstance(data, dict):
                raise ValueError('Invalid request')
            values = {}
            for field, limit in FIELDS.items():
                value = data.get(field, '')
                if not isinstance(value, str) or len(value) > limit:
                    raise ValueError('Invalid field')
                values[field] = value.strip()
            if any(not values[k] for k in ('store', 'name', 'phone', 'city')) or values['type'] not in TYPES:
                raise ValueError('Missing field')
            if values['email'] and not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', values['email']):
                raise ValueError('Invalid email')
            if any('\n' in values[k] or '\r' in values[k] for k in FIELDS if k != 'note'):
                raise ValueError('Invalid field')
        except (ValueError, json.JSONDecodeError, UnicodeDecodeError):
            self.respond(400, {'error': 'Lütfen form bilgilerini kontrol edin.'})
            return
        try:
            host = os.environ['SMTP_HOST']
            port = int(os.environ.get('SMTP_PORT', '587'))
            sender = os.environ['SMTP_FROM']
            recipient = os.environ.get('DEALER_TO', 'info@onbrands.com.tr')
            message = EmailMessage()
            message['Subject'] = 'Yeni bayi başvurusu'
            message['From'] = sender
            message['To'] = recipient
            if values['email']:
                message['Reply-To'] = values['email']
            labels = {'store': 'Mağaza adı', 'name': 'Yetkili', 'phone': 'Telefon', 'email': 'E-posta', 'city': 'Şehir', 'type': 'Mağaza tipi', 'note': 'Not'}
            message.set_content('\n'.join(f'{label}: {values[key] or "-"}' for key, label in labels.items()))
            rows = ''.join(
                f'<tr><th align="left" valign="top">{html.escape(label)}</th>'
                f'<td>{html.escape(values[key] or "-").replace(chr(10), "<br>")}</td></tr>'
                for key, label in labels.items()
            )
            message.add_alternative(f'<html><body><h2>Yeni bayi başvurusu</h2><table cellpadding="6">{rows}</table></body></html>', subtype='html')
            context = ssl.create_default_context()
            if port == 465:
                smtp = smtplib.SMTP_SSL(host, port, timeout=15, context=context)
            else:
                smtp = smtplib.SMTP(host, port, timeout=15)
            with smtp:
                if port != 465:
                    smtp.starttls(context=context)
                smtp.login(os.environ['SMTP_USER'], os.environ['SMTP_PASSWORD'])
                smtp.send_message(message)
        except (KeyError, ValueError, OSError, smtplib.SMTPException):
            self.log_error('Dealer application delivery failed')
            self.respond(500, {'error': 'Başvurunuz gönderilemedi. Lütfen tekrar deneyin.'})
            return
        self.respond(200, {'ok': True})

    def respond(self, status, body):
        payload = json.dumps(body, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def do_GET(self):
        path = unquote(urlsplit(self.path).path)
        root = Path(__file__).resolve().parent
        target = (root / path.lstrip('/')).resolve()
        if path == '/':
            target = root / 'index.html'
        allowed = target.parent == root and target.suffix in {'.html', '.css', '.js', '.txt'}
        allowed = allowed or (root / 'assets') in target.parents
        if not allowed or not target.is_file():
            self.send_error(404)
            return
        super().do_GET()

    def do_HEAD(self):
        self.send_error(405)


if __name__ == '__main__':
    os.chdir(Path(__file__).resolve().parent)
    ThreadingHTTPServer((os.environ.get('HOST', '127.0.0.1'), int(os.environ.get('PORT', '8000'))), Handler).serve_forever()
