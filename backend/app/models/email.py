from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.common import PyObjectId


class EmailModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)

    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user_id: PyObjectId

    from_name: str
    subject: str
    category: str = "Application Received"
    body: str = ""
    received_at: datetime = Field(default_factory=datetime.utcnow)
    read: bool = False
    recommended_action: str = ""
    application_id: Optional[PyObjectId] = None
    source: str = "manual"  # manual | gmail_sync

    created_at: datetime = Field(default_factory=datetime.utcnow)
