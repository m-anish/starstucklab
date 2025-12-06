"""
Starstuck Lab CLI Library

Shared utilities for all CLI tools.
"""

from .output import Output, Style, Progress, colorize, green, red, yellow, blue, cyan, bold, dim
from .config import Config, get, set, load
from .paths import Paths, get_paths
from .prompts import Prompt

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
]

__version__ = '1.0.0'