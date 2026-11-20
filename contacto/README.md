# Recepción de consultas comerciales

La portada envía los campos `empresa`, `correo`, `sistema` y `mensaje` a `POST /api/contacto` dentro del mismo origen. El campo oculto `sitio_web` debe quedar vacío. El receptor entrega la consulta por SMTP y responde `200 {"recibida":true}` tras la aceptación del mensaje por el relay. Una indisponibilidad del receptor o del correo debe mostrarse como error de envío.

## Configuración privada del servicio

| Variable de entorno | Uso |
| --- | --- |
| `BUSKIT_CONTACT_SMTP_HOST` | Host del relay SMTP institucional. |
| `BUSKIT_CONTACT_FROM` | Una dirección autorizada para enviar por ese relay. |
| `BUSKIT_CONTACT_TO` | Una dirección institucional que recibirá las consultas. |
| `BUSKIT_CONTACT_TLS`, `BUSKIT_CONTACT_SMTP_PORT` | Por defecto `starttls` en 587. Para TLS implícito usar `tls` en 465. Ambas opciones verifican el certificado. |
| `BUSKIT_CONTACT_SMTP_USER`, `BUSKIT_CONTACT_SMTP_PASSWORD` | Configurarlas juntas si el relay requiere autenticación. |
| `BUSKIT_CONTACT_ORIGIN` | En producción, origen HTTPS exacto de la portada, sin barra final. |
| `BUSKIT_CONTACT_TRUSTED_PROXY` | IP del proxy inmediato si comunica la dirección del cliente. El proxy debe reemplazar `X-Real-IP` con la IP observada. |

Mantener estas variables en el entorno privado del proceso. La dirección introducida por el visitante se utiliza como `Reply-To`. El receptor valida los campos, admite hasta 48 KiB de cuerpo y limita los intentos de entrega a cuatro por cliente y cuarenta por proceso cada diez minutos.

## Desarrollo y publicación

Desde la raíz del repositorio ejecutar `python -B contacto/app.py` con Python 3.10 o superior. Abrir `http://127.0.0.1:8080`. El servidor local sirve la portada y el receptor en el mismo origen. Al enviar una consulta utiliza el relay configurado. Con el correo sin configurar devuelve HTTP 503.

En el entorno de publicación, ejecutar `contacto.app:application` con un servidor WSGI. Dirigir únicamente `/api/contacto` a ese proceso desde el proxy HTTPS que recibe el tráfico del dominio. Servir la portada y los recursos estáticos de forma habitual. GitHub Pages sirve archivos estáticos y necesita un proxy en el dominio para esta ruta.

El límite de intentos se guarda en memoria. Con varias instancias, aplicar el límite compartido en el proxy. Mantener el registro de cuerpos, direcciones y cabeceras de correo desactivado en el proxy y en el servidor WSGI.
