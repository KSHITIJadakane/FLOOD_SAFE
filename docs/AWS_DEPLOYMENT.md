# AWS Open-Source Tooling & Local-First Plan

**Decision:** FloodSafe is built **locally with AWS open-source tools**. It is not deployed on AWS for the hackathon. This satisfies the event rule (use at least one AWS open-source tool *or* deploy on AWS). Local builds and deployed builds are scored equally, and judges only see the 3-minute demo video.

## 1. Tool choices
| Tool | Role in FloodSafe | Priority |
| --- | --- | --- |
| **Cedar** (open-source policy language) | Real authorization for the API: roles, who can run plans, who can record verified results, and a hard "no automatic advisory" rule. See [AUTHORIZATION_CEDAR.md](AUTHORIZATION_CEDAR.md). | **Core** |
| **SAM CLI** | Run an S3-event-style data-package ingestion Lambda locally (`sam local invoke`). | Stretch |
| **LocalStack** | Local S3 (and optionally EventBridge/SQS) to simulate the "approved GIS package arrives" flow without an AWS account. | Stretch |
| Strands Agents SDK | Only if you add the optional incident brief; not needed for the core. | Skip unless time remains |

Cedar is the one that must work end to end. A small, genuinely used tool beats a large unfinished architecture ("one feature that runs beats five that almost do").

## 2. Local stack
```text
React + TS + Leaflet  ->  FastAPI  --(Cedar check per request)-->  services (risk, optimizer)
                                   \-> PostgreSQL + PostGIS (Docker)
Stretch: LocalStack S3 -> SAM local Lambda (validate/ingest package) -> PostGIS
```
Docker Compose runs PostGIS (and LocalStack if used). No AWS account, card, or credentials are needed.

## 3. Cedar package choice (verify before committing)
Two Python options exist on PyPI as of this writing: `cedar-python` (described as Python bindings for Cedar) and `cedarpy` (a community project that states it is not officially supported by AWS or the Cedar team). Install one in a clean venv, run a 10-line allow/deny test, and pick whichever works on your Python version. If neither works, fall back to the Cedar CLI invoked as a subprocess.

## 4. Optional: LocalStack + SAM stretch
```yaml
# docker-compose.yml (excerpt)
services:
  db:
    image: postgis/postgis:16-3.4
    environment: { POSTGRES_PASSWORD: change_me, POSTGRES_DB: floodsafe }
    ports: ["5432:5432"]
  localstack:
    image: localstack/localstack
    ports: ["4566:4566"]
    environment: { SERVICES: s3 }
```
```bash
awslocal s3 mb s3://floodsafe-packages
sam local invoke IngestPackageFunction --event events/s3_put.json
```
Only build this after scoring, optimizer, map, queue, and Cedar are working.

## 5. What the video must say about AWS
One slide, 20–30 seconds: "FloodSafe's access control runs on **Cedar**, AWS's open-source policy language. Roles and safety rules are policies, not code. [If built: package ingestion is tested locally with **SAM CLI** and **LocalStack**.] The same design deploys to Lambda, RDS and Amplify later."

## 6. Deployment later (not for this submission)
Optional path: Amplify (frontend), Lambda or container service (API), RDS for PostgreSQL (verify PostGIS support/version), S3 (data packages). Check current AWS docs for availability, pricing, and free-tier limits first.

## 7. Security essentials (still apply locally)
- No keys, passwords, or tokens in the repo; `.env` only.
- Least-privilege roles via Cedar; default deny.
- Logs free of secrets and unnecessary personal data.
- Synthetic data labelled everywhere.

## 8. `.env.example`
```bash
DATABASE_URL=postgresql+psycopg://floodsafe:change_me@localhost:5432/floodsafe
APP_ENV=local
RANDOM_SEED=42
CEDAR_POLICY_DIR=./policies
LOCALSTACK_ENDPOINT=http://localhost:4566   # stretch only
```
