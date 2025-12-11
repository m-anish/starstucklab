"""
Starstuck Lab CLI Library

Shared utilities for all CLI tools.
"""

from .output import Output, Style, Progress, colorize, green, red, yellow, blue, cyan, bold, dim
from .config import Config, get, set, load
from .paths import Paths, get_paths
from .prompts import Prompt
from .ai import AIHelper, AIClient, get_ai_client, generate_text, generate_image

__all__ = [
    # Output
    'Output',
    'Style',
    'Progress',
    'colorize',
    'green',
    'red',
    'yellow',
    'blue',
    'cyan',
    'bold',
    'dim',

    # Config
    'Config',
    'get',
    'set',
    'load',

    # Paths
    'Paths',
    'get_paths',

    # Prompts
    'Prompt',

    # AI
    'AIHelper',
    'AIClient',
    'get_ai_client',
    'generate_text',
    'generate_image',
]

__version__ = '1.0.0'