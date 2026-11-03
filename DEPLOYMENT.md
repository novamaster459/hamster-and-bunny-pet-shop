# Hosting the shop

The site is deployed to Netlify as static files. Netlify's `/api/*` route is a
same-origin proxy to the Flask API, so login cookies work without exposing
cross-origin API access. The Flask server must run separately on a persistent
Python host; Netlify does not run this Flask application.

## 1. Deploy the Flask API

Deploy this project to a Python host that provides HTTPS and persistent storage.
Configure:

- `APP_ENV=production`
- `FLASK_SECRET_KEY` to a private, randomly generated value (for example,
  `python -c "import secrets; print(secrets.token_hex(32))"`)
- `SHOP_DATA_FILE` to a file on the host's persistent disk, such as
  `/var/data/shop_data.json`

The included `Procfile` starts Gunicorn with one worker. Keep one worker when
using this JSON-file store; configure the host's persistent disk at the path
used by `SHOP_DATA_FILE`. Back up that file securely because it contains
customer records and password hashes. Do not commit it to source control.

For a new shop, create an administrator once from the server console:

```sh
flask --app server create-admin
```

This prompts for the administrator's name, email, and a password of at least
12 characters. It does not create an account on site visits or expose a
default password. Existing administrator accounts are kept. If an old database
still uses the known `admin123` password, the server disables that password;
set a new one from the server console with:

```sh
flask --app server set-admin-password --email admin@example.com
```

## 2. Deploy the Netlify site

Connect the repository to Netlify and set the environment variable
`SHOP_API_URL` to the Flask server's HTTPS origin, for example
`https://your-shop-api.example.com` (no `/api` suffix).
Set it in **Site configuration → Environment variables**, then redeploy. It
must be the URL from a separately deployed Flask backend, not the Netlify
website URL. If it points back to this Netlify site, API requests can loop and
return HTTP 508.

Netlify reads `netlify.toml` to run the dependency-free static build and publish
only `dist/`. The private Python code and `shop_data.json` are not published as
website files. Deploy after setting the environment variable.

## Admin sign-in behavior

Visitors and new registrations are customers. Admins must choose **Admin** and
enter their administrator credentials. Customer accounts cannot access the
dashboard. An administrator session is cleared when the site is opened or
refreshed, so a previous admin login does not silently unlock the dashboard.
