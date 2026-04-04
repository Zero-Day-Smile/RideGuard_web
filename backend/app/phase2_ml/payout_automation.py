from __future__ import annotations

"""Phase 2 payout automation stub.

Provides a small `PayoutProcessor` that simulates validating a
claim and initiating a payout, mirroring the public interface of
the original hackathon script while keeping dependencies light.
"""

from dataclasses import dataclass
from datetime import datetime, timezone
import time
import uuid
from typing import Dict


@dataclass
class PayoutProcessor:
    processing_time: float = 0.0  # seconds; kept small for API latency

    def validate_user(self, fraud_result: Dict, trigger_result: Dict) -> bool:
        """Decide whether the claim is eligible for auto-payout.

        We consider fraud risk and whether a parametric trigger
        fired. Low fraud risk or a clear trigger leads to payout.
        """

        fraud_suspected = bool(fraud_result.get("fraud_suspected", False))
        risk_score = float(fraud_result.get("risk_score", 0.0))
        triggered = bool(trigger_result.get("triggered", False))

        if fraud_suspected and risk_score >= 0.8:
            return False

        if triggered and risk_score <= 0.75:
            return True

        return risk_score <= 0.4

    def initiate_payment(self, user_id: str, amount: float, channel: str = "UPI") -> Dict[str, str]:
        if self.processing_time > 0:
            time.sleep(min(self.processing_time, 0.2))

        txn_id = str(uuid.uuid4())
        return {
            "transaction_id": txn_id,
            "user_id": user_id,
            "amount": f"{amount:.2f}",
            "channel": channel,
            "processed_at": datetime.now(timezone.utc).isoformat(),
            "status": "SUCCESS",
        }
