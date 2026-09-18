from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, registry

from enums.enums import Translations

table_registry = registry()

@table_registry.mapped_as_dataclass
class Request():
    __tablename__ = 'requests'

    id: Mapped[int] = mapped_column(
        init=False,
        primary_key=True,
        autoincrement=True,
    )
    username: Mapped[str] = mapped_column(nullable=False)
    email: Mapped[str] = mapped_column(nullable=False)
    contact_phone: Mapped[str] = mapped_column(nullable=False)
    enterprise: Mapped[str] = mapped_column()
    translation_from: Mapped[Translations] = mapped_column(
        SQLEnum(Translations),
        nullable=False
    )
    translation_to: Mapped[Translations] = mapped_column(
        SQLEnum(Translations),
        nullable=False
    )
    observations: Mapped[str]