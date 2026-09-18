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
    DEVELOPING = 'developing'
    TESTING = 'testing'
    DONE = 'done'