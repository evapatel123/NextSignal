# NextSignal

**A prediction market intelligence platform for analyzing probabilities, monitoring events, and identifying potential market mispricing.**

NextSignal is a full-stack analytics application that brings prediction-market data from Polymarket and Kalshi into a centralized dashboard. It helps users explore active markets, compare market-implied probabilities, monitor potential signals, and evaluate forecasting performance when historical predictions and resolved outcomes are available.

Built with Next.js, TypeScript, Python, and FastAPI, NextSignal combines live market-data integrations with analytics tools and a modern dashboard.

## Features

- **Live Market Data:** Retrieve public market data from Polymarket and Kalshi.
- **Analytics Dashboard:** View market activity, source coverage, metrics, and potential signals in one place.
- **Event Explorer:** Browse and investigate prediction-market events and their probabilities.
- **Potential Mispricing Detection:** Highlight probability differences that may warrant further investigation.
- **Calibration Analytics:** Evaluate forecasting performance using historical predictions and resolved outcomes when sufficient data is available.
- **Alerts and Monitoring:** Review potential market signals and relevant changes.
- **Historical Data Support:** Store market observations to support analysis as historical data accumulates.
- **Automatic Synchronization:** Support startup synchronization and periodic background market-data refreshes.
- **API Documentation:** Explore backend endpoints through FastAPI's interactive documentation.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | Next.js, React, TypeScript |
| Styling and UI | Tailwind CSS, Radix UI |
| Charts | Recharts |
| Backend | Python, FastAPI |
| Data validation | Pydantic |
| Database | SQLAlchemy, SQLite by default |
| HTTP requests | HTTPX |
| Testing | pytest |
| Package manager | pnpm |

## Getting Started

### Prerequisites

Install the following before running NextSignal:

- Node.js 20 or newer
- pnpm 9 or newer
- Python 3.11 or newer
- Git

### 1. Clone the repository

```bash
git clone https://github.com/YOUR-USERNAME/NextSignal.git
cd NextSignal
```

If you upload the project with its original nested folder structure, navigate into `NextSignal/NextSignalMain` before running the following commands.

### 2. Configure environment variables

Copy the example environment file:

**Windows PowerShell**

```powershell
Copy-Item .env.example .env
```

**macOS / Linux**

```bash
cp .env.example .env
```

Review `.env` and configure the backend URL, database, and synchronization settings as needed.

Do not commit your actual `.env` file or any credentials.

### 3. Install frontend dependencies

From the directory containing `package.json`, run:

```bash
pnpm install
```

### 4. Set up the Python backend

**Windows PowerShell**

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
py -m pip install -r requirements.txt
```

**macOS / Linux**

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

### 5. Start the backend

In Terminal 1, from the backend project root:

```bash
py -m uvicorn src.server.main:app --reload --port 8000
```

On macOS or Linux, replace `py` with `python` if necessary.

The API will be available at:

- API: http://localhost:8000
- Interactive API documentation: http://localhost:8000/docs

### 6. Start the frontend

Open Terminal 2 in the directory containing `package.json`:

```bash
pnpm dev
```

Open the application at:

http://localhost:3000

Keep both terminals running while using the application.

## Configuration

Use `.env.example` to review the environment variables supported by your version of NextSignal.

Common configuration options include:

- `DATABASE_URL` — database connection string.
- `ENABLE_LIVE_INGEST` — enables live market-data ingestion.
- `AUTO_SEED` — controls initial data seeding.
- `AUTO_SYNC` — controls scheduled synchronization.
- `AUTO_SYNC_INTERVAL_MINUTES` — configures the synchronization interval.
- `BACKEND_URL` — backend URL used by the frontend server.
- `NEXT_PUBLIC_BACKEND_BASE` — API base URL used by frontend requests.

Variable names and behavior should match the actual configuration implemented in the repository. Keep private values in `.env` and use safe example values in `.env.example`.

## Testing and Verification

### Run backend tests

With the Python virtual environment activated:

```bash
python -m pytest src/server/tests
```

### Verify live market providers

```bash
python -m src.server.scripts.verify_live
```

This verification requires network access and depends on the current responses from the upstream providers.

### Build the frontend

```bash
pnpm build
```

Run these checks after making changes to help identify regressions.

## Understanding Calibration

Calibration analytics evaluate whether predicted probabilities correspond to observed outcomes over time.

For example, events assigned a probability near 70% should resolve positively approximately 70% of the time across a sufficiently large and representative sample.

Meaningful calibration analysis requires:

1. Historical probability predictions.
2. Genuine resolved outcomes.
3. Correct matching between predictions and their corresponding outcomes.

An empty sample does not indicate perfect accuracy. When observations are unavailable, calibration metrics should be shown as unavailable rather than as valid zero scores.

## Data and Limitations

- Market data and prices depend on the availability and accuracy of upstream providers.
- Historical analysis improves as valid observations accumulate.
- Similar-looking markets may have different settlement rules and should not automatically be treated as equivalent.
- Probability differences are not necessarily arbitrage opportunities.
- Signals are analytical indicators, not guarantees of profitable trades or accurate forecasts.

NextSignal is an analytical project, not financial advice.

## Contributing

Contributions, bug reports, documentation improvements, and suggestions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a change.

## Author

**Eva Patel**

GitHub: [@evapatel123](https://github.com/evapatel123)
