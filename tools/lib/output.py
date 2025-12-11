"""
Consistent terminal output formatting for Starstuck Lab CLI
"""

import sys
from typing import Optional


class Style:
    """ANSI color codes and formatting"""
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    MAGENTA = '\033[95m'
    BOLD = '\033[1m'
    DIM = '\033[2m'
    UNDERLINE = '\033[4m'
    RESET = '\033[0m'


class Output:
    """Unified output helper with emoji support"""
    
    emoji_enabled = True
    
    @classmethod
    def set_emoji(cls, enabled: bool):
        """Enable or disable emoji output"""
        cls.emoji_enabled = enabled
    
    @classmethod
    def success(cls, msg: str, prefix: Optional[str] = None):
        """Print success message"""
        if prefix is None:
            prefix = "✅" if cls.emoji_enabled else "[OK]"
        print(f"{Style.GREEN}{prefix}{Style.RESET} {msg}")
    
    @classmethod
    def error(cls, msg: str, prefix: Optional[str] = None):
        """Print error message"""
        if prefix is None:
            prefix = "❌" if cls.emoji_enabled else "[ERROR]"
        print(f"{Style.RED}{prefix}{Style.RESET} {msg}", file=sys.stderr)
    
    @classmethod
    def info(cls, msg: str, prefix: Optional[str] = None):
        """Print info message"""
        if prefix is None:
            prefix = "ℹ️ " if cls.emoji_enabled else "[INFO]"
        print(f"{Style.BLUE}{prefix}{Style.RESET} {msg}")
    
    @classmethod
    def warning(cls, msg: str, prefix: Optional[str] = None):
        """Print warning message"""
        if prefix is None:
            prefix = "⚠️ " if cls.emoji_enabled else "[WARN]"
        print(f"{Style.YELLOW}{prefix}{Style.RESET} {msg}")
    
    @classmethod
    def progress(cls, msg: str, prefix: Optional[str] = None):
        """Print progress message"""
        if prefix is None:
            prefix = "🔄" if cls.emoji_enabled else "[...]"
        print(f"{Style.CYAN}{prefix}{Style.RESET} {msg}")
    
    @classmethod
    def header(cls, msg: str):
        """Print bold header"""
        print(f"\n{Style.BOLD}{msg}{Style.RESET}\n")
    
    @classmethod
    def section(cls, msg: str):
        """Print section with decorative lines"""
        print(f"\n{Style.CYAN}{'='*60}{Style.RESET}")
        print(f"{Style.BOLD}{msg}{Style.RESET}")
        print(f"{Style.CYAN}{'='*60}{Style.RESET}\n")
    
    @classmethod
    def dim(cls, msg: str):
        """Print dimmed text"""
        print(f"{Style.DIM}{msg}{Style.RESET}")
    
    @classmethod
    def bold(cls, msg: str):
        """Print bold text"""
        print(f"{Style.BOLD}{msg}{Style.RESET}")
    
    @classmethod
    def table_row(cls, *columns, widths=None):
        """Print a table row with aligned columns"""
        if widths is None:
            widths = [20] * len(columns)
        
        row = "  ".join(
            str(col).ljust(width) for col, width in zip(columns, widths)
        )
        print(row)
    
    @classmethod
    def divider(cls, char: str = "-", length: int = 60):
        """Print a divider line"""
        print(f"{Style.DIM}{char * length}{Style.RESET}")


class Progress:
    """Simple progress indicator"""
    
    def __init__(self, total: int, description: str = ""):
        self.total = total
        self.current = 0
        self.description = description
    
    def update(self, n: int = 1):
        """Update progress"""
        self.current += n
        self._render()
    
    def set(self, value: int):
        """Set absolute progress value"""
        self.current = value
        self._render()
    
    def _render(self):
        """Render progress bar"""
        if self.total == 0:
            percent = 100
        else:
            percent = int((self.current / self.total) * 100)
        
        filled = int(percent / 5)
        bar = "█" * filled + "░" * (20 - filled)
        
        status = f"[{bar}] {percent}%"
        if self.description:
            status += f" {self.description}"
        
        # Clear line and print
        print(f"\r{status}", end="", flush=True)
        
        if self.current >= self.total:
            print()  # New line when complete
    
    def complete(self, message: str = "Complete"):
        """Mark as complete"""
        self.current = self.total
        self._render()
        Output.success(message)


def colorize(text: str, color: str) -> str:
    """Wrap text in color codes"""
    return f"{color}{text}{Style.RESET}"


# Convenient color functions
def green(text: str) -> str:
    return colorize(text, Style.GREEN)

def red(text: str) -> str:
    return colorize(text, Style.RED)

def yellow(text: str) -> str:
    return colorize(text, Style.YELLOW)

def blue(text: str) -> str:
    return colorize(text, Style.BLUE)

def cyan(text: str) -> str:
    return colorize(text, Style.CYAN)

def bold(text: str) -> str:
    return colorize(text, Style.BOLD)

def dim(text: str) -> str:
    return colorize(text, Style.DIM)