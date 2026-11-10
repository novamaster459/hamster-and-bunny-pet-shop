# Hosting the shop

## Deploying on Railway

The shop runs as a single Flask app on Railway. Railway serves both the API and
the static files (`index.html`, `styles.css`, `app.js`), so no separate static
host or API URL is needed. The `netlify/` folder and `netlify.toml` are legacy
and unused for this setup.

1. Push the repository to GitHub (`main` branch).
2. In Railway choose **New Project → Deploy from GitHub repo** and select
   `hamster-and-bunny-pet-shop`. Railway detects Python through Nixpacks and
   uses `railway.json` (or the `Procfile`) to start
   `gunicorn --bind 0.0.0.0:$PORT --workers 1 --threads 4 server:app`.
3. Open **Variables** and add:

   | Variable | Value |
   | --- | --- |
   | `FLASK_SECRET_KEY` | a private random value; generate one with `python -c "import secrets; print(secrets.token_hex(32))"` |
   | `APP_ENV` | `production` (optional; when set, `FLASK_SECRET_KEY` is required) |
   | `SHOP_ADMIN_EMAIL` | the first administrator's email |
   | `SHOP_ADMIN_PASSWORD` | the administrator password, at least 12 characters |
   | `SHOP_ADMIN_NAME` | optional display name (defaults to `Shop Admin`) |
   | `SHOP_DATA_FILE` | `/data/shop_data.json` (see persistent storage below) |

4. Open **Settings → Networking** and generate a public domain.

After that, every push to `main` redeploys automatically.

### Persistent storage

Railway containers start from the repository, and `shop_data.json` is ignored
by Git, so the app seeds an empty shop on first boot. To keep orders, users and
gallery uploads across redeploys, add a **Volume** mounted at `/data` and set
`SHOP_DATA_FILE=/data/shop_data.json`. Gallery uploads are stored beside that
file in `/data/media`.

Without a volume the shop still works, but its data resets whenever the
container is replaced. Keep one Gunicorn worker while using the JSON-file
store, and back up the data file because it contains customer records and
password hashes.

### Administrator account

If the data file has no administrator, the server creates the built-in
first-run admin at startup: `maythu@gmail.com` with the password chosen for
this shop (its scrypt hash lives in `server.py`). Change the email or password
from the admin dashboard after signing in.

Set `SHOP_ADMIN_EMAIL` and `SHOP_ADMIN_PASSWORD` (or `ADMIN_EMAIL` /
`ADMIN_PASSWORD`) to seed a different account instead; the password must be at
least 12 characters. Existing administrators are never overwritten, so password
changes made in the app survive restarts.

Because the default account hash is in the repository, set the variables above
if the repository is public and you want credentials that are not in Git.

To reset a hosted password, open a Railway shell and run:

```sh
flask --app server set-admin-password --email maythu@gmail.com
```

With a volume this updates the stored account. Without a volume, change
`SHOP_ADMIN_PASSWORD` on a fresh deployment, or delete the data file first so
the bootstrap creates the account again.

The homepage gallery supports up to 26 image/video uploads (50 MB each).
Guest checkout requires a Yangon township, contact name and phone number.
Customers receive a private order lookup code; admins accept or deny orders
from the dashboard.

## Admin sign-in behavior

Visitors and new registrations are customers. Admins must choose **Admin** and
enter their administrator credentials. Customer accounts cannot access the
dashboard. An administrator session is cleared when the site is opened or
refreshed, so a previous admin login does not silently unlock the dashboard.
