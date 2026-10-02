# Operaciones

## Componentes

- Nginx entrega el frontend y enruta `/api`.
- `smarttraining.service` ejecuta la API en `127.0.0.1:3000`.
- `/var/lib/smarttraining` contiene SQLite, JSON, videos y miniaturas.
- `/etc/smarttraining/smarttraining.env` contiene la configuración privada.

## Comprobación rápida

```bash
curl -I https://smarttraining.innovalogic.tech/
curl https://smarttraining.innovalogic.tech/api/health
sudo systemctl status smarttraining --no-pager -l
sudo journalctl -u smarttraining -n 100 --no-pager
```

## Responsabilidades

- Vigilar disco, memoria, CPU y errores de FFmpeg.
- Mantener HTTPS y renovación del certificado.
- Respaldar externamente `/var/lib/smarttraining` y probar restauración.
- Revisar auditoría administrativa.
- No ejecutar dos APIs contra los mismos archivos JSON.

Consulte [despliegue](DEPLOYMENT.md), [troubleshooting](TROUBLESHOOTING.md) y [riesgos](22-risks-and-limitations.md).
