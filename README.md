# Scale Rx

A tiny daily prescription generator for Francois Rabbath scale practice.

## What It Does

Each run chooses one key while excluding keys from the last 10 history entries, then prints a daily practice prescription.

- Keys with modular and complete scales get one modular scale, one complete scale, one arpeggio, and one alternating thirds exercise.
- Keys with modular scales but no complete scales get two distinct modular scale combinations, one arpeggio, and one alternating thirds exercise.
- `Eb major` gets two distinct complete scales, one arpeggio, and one alternating thirds exercise.

History is intentionally small: `data/history.json` stores only `{ "date": "...", "key": "..." }`.

## Run

```powershell
node src/cli.js
```

For a test run that does not update history:

```powershell
node src/cli.js --dry-run
```

For a specific date:

```powershell
node src/cli.js --date 2026-06-01
```

## Email

Create a local `.env` file:

```env
SCALE_RX_EMAIL_TO=your_email@gmail.com
SCALE_RX_EMAIL_FROM=your_email@gmail.com
SCALE_RX_SMTP_HOST=smtp.gmail.com
SCALE_RX_SMTP_PORT=465
SCALE_RX_SMTP_USER=your_email@gmail.com
SCALE_RX_SMTP_PASS=your_app_password
```

Check that the required variables are present:

```powershell
node src/cli.js --check-email-config
```

Send a test email without updating history:

```powershell
node src/cli.js --email-test
```

Send the daily email and update history:

```powershell
node src/cli.js --email
```

## Hosted Daily Schedule

The GitHub Actions workflow in `.github/workflows/daily-email.yml` runs every day at 8:00 AM Eastern.

Add these repository secrets in GitHub:

- `SCALE_RX_EMAIL_TO`
- `SCALE_RX_EMAIL_FROM`
- `SCALE_RX_SMTP_HOST`
- `SCALE_RX_SMTP_PORT`
- `SCALE_RX_SMTP_USER`
- `SCALE_RX_SMTP_PASS`

The workflow sends the email, updates `data/history.json`, and commits that history update back to the repository.

## Test

```powershell
node --test
```
