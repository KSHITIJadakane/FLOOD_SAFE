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
)
from backend.app.data_generator import generate_synthetic_dataset


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

    def seed_default_data(self, seed: int = 42) -> FloodEvent:
        with self._lock:
            event, sources, pop_units = generate_synthetic_dataset(seed=seed)
            self.events[event.id] = event
            self.population_units[event.id] = pop_units
            for s in sources:
                self.sources[s.id] = s
                self.sources_by_code[s.source_code] = s
            return event

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
