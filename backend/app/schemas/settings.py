from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class SettingsUpdate(BaseModel):
    fdm_rate_per_hour: float
    resin_rate_per_hour: float
    default_margin: float
    default_min_alert_weight: float
    whatsapp_number: Optional[str] = None


class SettingsOut(BaseModel):
    id: int
    fdm_rate_per_hour: float
    resin_rate_per_hour: float
    default_margin: float
    default_min_alert_weight: float
    whatsapp_number: Optional[str]
    updated_at: datetime

    model_config = {"from_attributes": True}


class PublicSettingsOut(BaseModel):
    whatsapp_number: Optional[str]

    model_config = {"from_attributes": True}
