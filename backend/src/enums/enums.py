from enum import Enum


class Translations(Enum):
    PORTUGUESE = 'portuguese'
    ENGLISH = 'english'
    SPANISH = 'spanish'
    GERMAN = 'german'
    ITALIAN = 'italian'
    FRANCH = 'french'
    OTHER = 'other'


class Status(Enum):
    READY = 'ready'
    IN_PROGRESS = 'in_progress'
    TESTING = 'testing'
    DONE = 'done'


class EmployeeStatus(Enum):
    AVAILABLE = 'available'
    BUSY = 'busy'
    PENDING = 'pending'


class Roles(Enum):
    ADMIN = 'admin'
    PROJETOS = 'projetos'
    ATENDIMENTO = 'atendimento'
    FREELANCER = 'freelancer'
