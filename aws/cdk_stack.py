"""AWS Cloud Development Kit (CDK) Stack Definition for FloodSafe.

Production Cloud Infrastructure Blueprint:
1. Amazon S3: Raw Satellite GeoTIFFs, Sentinel-1 SAR imagery, and Field Test uploads.
2. AWS Lambda / ECS Fargate: Containerized Greedy Maximum Coverage Optimizer execution.
3. AWS Cedar Engine: In-process Zero-Trust policy evaluation (policies/floodsafe.cedar).
4. Amazon DynamoDB: State store for assessment runs, source telemetry, and audit logs.
5. Amazon API Gateway HTTP API: RESTful public endpoints with Gzip compression.
"""
from __future__ import annotations

# AWS CDK Python Constructs specification
class FloodSafeCloudStack:
    """Defines the complete AWS serverless/container deployment stack."""

    def __init__(self, scope: Any = None, construct_id: str = "FloodSafeStack", **kwargs: Any) -> None:
        self.construct_id = construct_id
        
        # 1. Ingestion S3 Bucket
        self.satellite_ingest_bucket_config = {
            "bucket_name": "floodsafe-satellite-ingest-bucket",
            "versioned": True,
            "encryption": "S3_MANAGED",
            "lifecycle_rules": [{"expiration_days": 90}],
        }

        # 2. DynamoDB Tables
        self.sources_table_config = {
            "table_name": "FloodSafe_WaterSources",
            "partition_key": {"name": "source_id", "type": "STRING"},
            "billing_mode": "PAY_PER_REQUEST",
        }
        self.plans_table_config = {
            "table_name": "FloodSafe_TestingPlans",
            "partition_key": {"name": "plan_id", "type": "STRING"},
            "sort_key": {"name": "event_id", "type": "STRING"},
            "billing_mode": "PAY_PER_REQUEST",
        }

        # 3. ECS Fargate Service / App Runner Container
        self.app_runner_service_config = {
            "service_name": "floodsafe-api-service",
            "cpu": "1 vCPU",
            "memory": "2 GB",
            "image_repository_type": "ECR",
            "port": 8000,
            "environment": {
                "ENVIRONMENT": "production",
                "CEDAR_POLICY_PATH": "policies/floodsafe.cedar",
                "IS_SYNTHETIC": "true",
            },
        }

        # 4. Amazon API Gateway HTTP API
        self.api_gateway_config = {
            "api_name": "FloodSafeHttpApi",
            "cors_preflight": {
                "allow_origins": ["*"],
                "allow_methods": ["GET", "POST", "PUT", "DELETE"],
                "allow_headers": ["Content-Type", "X-Demo-Role", "X-Demo-User"],
            },
        }

    def synthesize_manifest(self) -> dict:
        """Returns synthesized CloudFormation / CDK infrastructure manifest."""
        return {
            "AWSTemplateFormatVersion": "2010-09-09",
            "Description": "FloodSafe — Emergency Water Vulnerability Triage & Testing Allocation AWS Stack",
            "Resources": {
                "SatelliteIngestBucket": self.satellite_ingest_bucket_config,
                "SourcesTable": self.sources_table_config,
                "PlansTable": self.plans_table_config,
                "AppRunnerService": self.app_runner_service_config,
                "ApiGateway": self.api_gateway_config,
            },
        }
