"""
Shared building blocks used by every model in the app.
"""
from typing import Annotated, Any
from bson import ObjectId
from pydantic import BeforeValidator, PlainSerializer, WithJsonSchema


def _validate_object_id(v: Any) -> ObjectId:
    if isinstance(v, ObjectId):
        return v
    if ObjectId.is_valid(v):
        return ObjectId(v)
    raise ValueError("Invalid ObjectId")


# Use this type anywhere a Mongo _id needs to flow through a Pydantic model.
# It accepts str or ObjectId in, and always serialises back out as a str.
PyObjectId = Annotated[
    ObjectId,
    BeforeValidator(_validate_object_id),
    PlainSerializer(lambda x: str(x), return_type=str),
    WithJsonSchema({"type": "string"}),
]
