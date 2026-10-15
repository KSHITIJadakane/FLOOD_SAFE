"""Thread-safe data storage repository for FloodSafe prototype."""
from __future__ import annotations
import threading
from typing import Dict, List, Optional
from backend.app.models import (
    FloodEvent,
    WaterSource,
    PopulationUnit,
    AssessmentRun,
    TestingPlan,
    FieldTest,
    IoTSensorNode,
)
from backend.app.data_generator import generate_synthetic_dataset, generate_synthetic_iot_nodes


class StorageRepository:
    def __init__(self):
        self._lock = threading.RLock()
        self.events: Dict[str, FloodEvent] = {}
        self.sources: Dict[str, WaterSource] = {}  # source_id -> WaterSource
        self.sources_by_code: Dict[str, WaterSource] = {}
        self.population_units: Dict[str, List[PopulationUnit]] = {}  # event_id -> units
        self.assessment_runs: Dict[str, AssessmentRun] = {}  # run_id -> AssessmentRun
        self.latest_assessment_by_event: Dict[str, str] = {}  # event_id -> run_id
        self.testing_plans: Dict[str, TestingPlan] = {}  # plan_id -> TestingPlan
        self.field_tests: Dict[str, List[FieldTest]] = {}  # event_id -> tests
        self.iot_nodes: Dict[str, IoTSensorNode] = {}  # node_id -> IoTSensorNode

    def seed_default_data(self, seed: int = 42) -> FloodEvent:
        with self._lock:
            event, sources, pop_units = generate_synthetic_dataset(seed=seed)
            self.events[event.id] = event
            self.population_units[event.id] = pop_units
            for s in sources:
                self.sources[s.id] = s
                self.sources_by_code[s.source_code] = s
            iot_nodes = generate_synthetic_iot_nodes(seed=seed)
            for node in iot_nodes:
                self.iot_nodes[node.id] = node
            return event

    def get_iot_nodes(self) -> List[IoTSensorNode]:
        with self._lock:
            if not self.iot_nodes:
                for node in generate_synthetic_iot_nodes():
                    self.iot_nodes[node.id] = node
            return list(self.iot_nodes.values())

    def get_iot_node_by_id(self, node_id: str) -> Optional[IoTSensorNode]:
        with self._lock:
            if not self.iot_nodes:
                for node in generate_synthetic_iot_nodes():
                    self.iot_nodes[node.id] = node
            return self.iot_nodes.get(node_id)

    def get_event(self, event_id: str) -> Optional[FloodEvent]:
        with self._lock:
            return self.events.get(event_id)

    def list_events(self) -> List[FloodEvent]:
        with self._lock:
            return list(self.events.values())

    def get_sources(self) -> List[WaterSource]:
        with self._lock:
            return list(self.sources.values())

    def get_source_by_id(self, source_id: str) -> Optional[WaterSource]:
        with self._lock:
            return self.sources.get(source_id) or self.sources_by_code.get(source_id)

    def get_population_units(self, event_id: str) -> List[PopulationUnit]:
        with self._lock:
            return self.population_units.get(event_id, [])

    def save_assessment_run(self, run: AssessmentRun) -> None:
        with self._lock:
            self.assessment_runs[run.assessment_run_id] = run
            self.latest_assessment_by_event[run.event_id] = run.assessment_run_id

            # Persist to AWS DynamoDB if configured
            from backend.app.dynamodb_storage import get_dynamodb_storage
            dynamo = get_dynamodb_storage()
            if dynamo:
                try:
                    scored_dicts = [
                        s.model_dump() if hasattr(s, 'model_dump') else s.__dict__
                        for s in run.scored_sources
                    ]
                    dynamo.save_assessment_result(
                        assessment_run_id=run.assessment_run_id,
                        event_id=run.event_id,
                        scored_sources=scored_dicts,
                    )
                except Exception as e:
                    import logging
                    logging.getLogger(__name__).warning(
                        "DynamoDB persistence failed (in-memory retained): %s", e
                    )


    def get_assessment_run(self, run_id: str) -> Optional[AssessmentRun]:
        with self._lock:
            return self.assessment_runs.get(run_id)

    def get_latest_assessment(self, event_id: str) -> Optional[AssessmentRun]:
        with self._lock:
            run_id = self.latest_assessment_by_event.get(event_id)
            if run_id:
                return self.assessment_runs.get(run_id)
            return None

    def save_testing_plan(self, plan: TestingPlan) -> None:
        with self._lock:
            self.testing_plans[plan.plan_id] = plan

    def get_testing_plan(self, plan_id: str) -> Optional[TestingPlan]:
        with self._lock:
            return self.testing_plans.get(plan_id)

    def add_field_test(self, test: FieldTest) -> None:
        with self._lock:
            if test.event_id not in self.field_tests:
                self.field_tests[test.event_id] = []
            self.field_tests[test.event_id].append(test)

    def get_field_tests(self, event_id: str) -> List[FieldTest]:
        with self._lock:
            return self.field_tests.get(event_id, [])


# Global singleton instance
storage = StorageRepository()
