from pydantic import BaseModel
from typing import List, Optional

class LineItem(BaseModel):
    cpt_code: Optional[str]
    description: Optional[str]
    amount: Optional[float]

class AuditResult(BaseModel):
    audit_summary: str
    discrepancy_detected: bool
    flagged_items: List[dict]

class AppealRequest(BaseModel):
    audit_result: dict
    level: int = 3

class QueryRequest(BaseModel):
    query: str
