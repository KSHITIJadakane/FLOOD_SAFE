# ☁️ FloodSafe — AWS Native Architecture Blueprint

> **WeMakeDevs AWS Environmental Hacks (October 2026)**  
> Production-grade cloud deployment architecture combining Earth Observation data ingestion, Cedar zero-trust authorization, and containerized combinatorial optimization.

---

## 🏗️ Architecture Diagram

```mermaid
flowchart TD
    subgraph Earth_Observation ["🛰️ Earth Observation Data Ingestion"]
        S1["Copernicus Sentinel-1 SAR"] --> |C-Band Microwave Radar| S3_Ingest["Amazon S3 Raw Ingestion Bucket"]
        DEM["SRTM 30m DEM"] --> |Elevation Gradients| S3_Ingest
    end

    subgraph AWS_Cloud ["☁️ AWS Cloud Processing & Security Boundary"]
        S3_Ingest --> |Event Trigger| Lambda["AWS Lambda Satellite Preprocessor"]
        Lambda --> |Sigma-0 (dB) & TWI Features| API_Service["AWS App Runner / ECS Fargate<br/>(FastAPI Backend Container)"]
        
        subgraph Cedar_Security ["🛡️ AWS Cedar Authorization Engine"]
            Cedar_Engine["cedarpy Engine<br/>(policies/floodsafe.cedar)"]
            Cedar_Engine --> |Default-Deny Policy| API_Service
            Cedar_Engine --> |Forbid IssueAdvisory| API_Service
        end

        API_Service --> |Greedy Max-Coverage| DynamoDB["Amazon DynamoDB<br/>(Sources, Plans, Audit Logs)"]
    end

    subgraph Client_Layer ["📱 Client & Field Operations"]
        API_Service --> |Gzip REST API| WebUI["React + Vite Command Center"]
        WebUI --> |Leaflet GIS Canvas| Emergency_Manager["Disaster Response Coordinator"]
        WebUI --> |PDF Dispatch Dossier| Field_Team["Emergency Field Testing Team"]
    end
```

---

## 🔑 AWS Services Breakdown

| AWS Service | Role in FloodSafe | Key Benefit |
| :--- | :--- | :--- |
| **AWS Cedar (`cedarpy`)** | Core security & policy-based authorization | Strict Default-Deny RBAC/ABAC and public panic prevention invariants. |
| **Amazon S3** | Ingestion bucket for Sentinel-1 SAR and DEM GeoTIFFs | Durable, scalable cloud storage for raw radar and terrain files. |
| **AWS App Runner / ECS** | Hosts containerized FastAPI & NumPy Optimizer | Fully managed container runtime with automatic scaling and health monitoring. |
| **Amazon DynamoDB** | Persistent document database | Single-digit millisecond latency for source telemetry, testing plans, and Cedar audit logs. |
| **Amazon CloudWatch** | Centralized audit & telemetry logging | Full compliance tracking of all authorization decisions and optimization runtimes. |

---

## 🚀 Deployment Instructions

### 1. Deploy with AWS CDK
```bash
cd aws
pip install aws-cdk-lib
cdk deploy
```

### 2. Deploy with AWS SAM
```bash
sam build -t aws/template.yaml
sam deploy --guided
```
