"""
Smart interactive prompts with validation for Starstuck Lab CLI
"""

from typing import List, Optional, Callable, Any
from .output import Style, Output


class Prompt:
    """Interactive prompt utilities with smart defaults and validation"""
    
    @staticmethod
    def text(
        question: str,
        default: Optional[str] = None,
        validator: Optional[Callable[[str], bool]] = None,
        error_message: str = "Invalid input, please try again",
        example: Optional[str] = None,
        required: bool = True
    ) -> str:
        """
        Get text input with validation.
        
        Args:
            question: The question to ask
            default: Default value if user presses Enter
            validator: Optional validation function
            error_message: Message to show on validation failure
            example: Optional example to show
            required: Whether input is required (if False, empty is allowed)
        
        Returns:
            User's input as string
        """
        prompt_parts = [question]
        
        if example:
            prompt_parts.append(f"{Style.DIM}(e.g., {example}){Style.RESET}")
        
        if default:
            prompt_parts.append(f"[{default}]")
        
        prompt_parts.append(": ")
        full_prompt = " ".join(prompt_parts)
        
        while True:
            response = input(full_prompt).strip()
            
            # Handle default
            if not response and default:
                return default
            
            # Handle required check
            if not response and required:
                Output.error("This field is required", prefix="✗")
                continue
            
            # Handle empty but not required
            if not response and not required:
                return ""
            
            # Validate
            if validator:
                try:
                    if not validator(response):
                        Output.error(error_message, prefix="✗")
                        continue
                except Exception as e:
                    Output.error(f"Validation error: {e}", prefix="✗")
                    continue
            
            return response
    
    @staticmethod
    def choice(
        question: str,
        options: List[str],
        default: Optional[str] = None,
        allow_fuzzy: bool = True
    ) -> str:
        """
        Present numbered choices with fuzzy matching.
        
        Args:
            question: The question to ask
            options: List of options
            default: Default option if user presses Enter
            allow_fuzzy: Allow fuzzy/partial matching of options
        
        Returns:
            Selected option as string
        """
        print(f"\n{question}")
        
        for i, option in enumerate(options, 1):
            # Mark default with arrow
            marker = "→" if default and option == default else " "
            print(f"  {marker} {i}. {option}")
        
        # Build prompt with default indicator
        default_display = ""
        if default and default in options:
            default_idx = options.index(default) + 1
            default_display = f" [{default_idx}]"
        
        while True:
            response = input(f"\nChoose [1-{len(options)}]{default_display}: ").strip()
            
            # Handle default
            if not response and default:
                return default
            
            # Try as number
            if response.isdigit():
                idx = int(response) - 1
                if 0 <= idx < len(options):
                    return options[idx]
            
            # Try as exact match
            if response in options:
                return response
            
            # Try fuzzy match if enabled
            if allow_fuzzy:
                lower_response = response.lower()
                matches = [opt for opt in options if opt.lower().startswith(lower_response)]
                
                if len(matches) == 1:
                    print(f"{Style.CYAN}→{Style.RESET} Using: {matches[0]}")
                    return matches[0]
                elif len(matches) > 1:
                    Output.warning(f"Ambiguous input '{response}' matches: {', '.join(matches)}")
                    continue
            
            Output.error("Invalid choice, please try again", prefix="✗")
    
    @staticmethod
    def confirm(question: str, default: bool = False) -> bool:
        """
        Yes/no confirmation.
        
        Args:
            question: The question to ask
            default: Default value (True=Yes, False=No)
        
        Returns:
            Boolean True (yes) or False (no)
        """
        suffix = " [Y/n]" if default else " [y/N]"
        
        while True:
            response = input(f"{question}{suffix}: ").strip().lower()
            
            if not response:
                return default
            
            if response in ['y', 'yes', 'yeah', 'yep']:
                return True
            elif response in ['n', 'no', 'nope']:
                return False
            
            Output.error("Please enter 'y' or 'n'", prefix="✗")
    
    @staticmethod
    def multiselect(
        question: str,
        options: List[str],
        defaults: Optional[List[str]] = None,
        min_selections: int = 0,
        max_selections: Optional[int] = None
    ) -> List[str]:
        """
        Select multiple items from list.
        
        Args:
            question: The question to ask
            options: List of options
            defaults: Pre-selected options
            min_selections: Minimum number of selections required
            max_selections: Maximum number of selections allowed
        
        Returns:
            List of selected options
        """
        if defaults is None:
            defaults = []
        
        selected = set(defaults)
        
        print(f"\n{question}")
        print(f"{Style.DIM}(Enter numbers separated by commas, or press Enter when done){Style.RESET}\n")
        
        for i, option in enumerate(options, 1):
            marker = "◉" if option in selected else "◯"
            style = Style.GREEN if option in selected else Style.DIM
            print(f"  {style}{marker}{Style.RESET} {i}. {option}")
        
        if defaults:
            print(f"\n{Style.DIM}Current selection: {', '.join(defaults)}{Style.RESET}")
        
        while True:
            response = input(f"\nSelect [1-{len(options)}] (comma-separated): ").strip()
            
            # If empty, use current selection
            if not response:
                if len(selected) < min_selections:
                    Output.error(f"Please select at least {min_selections} option(s)", prefix="✗")
                    continue
                return list(selected)
            
            # Parse comma-separated numbers
            new_selected = set()
            valid = True
            
            for part in response.split(','):
                part = part.strip()
                if part.isdigit():
                    idx = int(part) - 1
                    if 0 <= idx < len(options):
                        new_selected.add(options[idx])
                    else:
                        Output.error(f"Invalid option number: {part}", prefix="✗")
                        valid = False
                        break
                elif part:
                    Output.error(f"Invalid input: {part}", prefix="✗")
                    valid = False
                    break
            
            if not valid:
                continue
            
            # Check max selections
            if max_selections and len(new_selected) > max_selections:
                Output.error(f"Please select at most {max_selections} option(s)", prefix="✗")
                continue
            
            # Check min selections
            if len(new_selected) < min_selections:
                Output.error(f"Please select at least {min_selections} option(s)", prefix="✗")
                continue
            
            return list(new_selected)
    
    @staticmethod
    def menu(
        title: str,
        options: List[tuple],
        return_value: bool = False
    ) -> Any:
        """
        Display a menu and get user selection.
        
        Args:
            title: Menu title
            options: List of (label, value) or (label, description, value) tuples
            return_value: If True, return the value; if False, return index
        
        Returns:
            Selected value or index
        """
        print(f"\n{Style.BOLD}{title}{Style.RESET}\n")
        
        # Normalize options format
        normalized = []
        for opt in options:
            if len(opt) == 2:
                label, value = opt
                description = None
            elif len(opt) == 3:
                label, description, value = opt
            else:
                raise ValueError("Options must be tuples of (label, value) or (label, description, value)")
            
            normalized.append((label, description, value))
        
        # Display menu
        for i, (label, description, _) in enumerate(normalized, 1):
            print(f"  {i}. {Style.BOLD}{label}{Style.RESET}")
            if description:
                print(f"     {Style.DIM}{description}{Style.RESET}")
            print()
        
        while True:
            response = input(f"Choose [1-{len(normalized)}]: ").strip()
            
            if response.isdigit():
                idx = int(response) - 1
                if 0 <= idx < len(normalized):
                    if return_value:
                        return normalized[idx][2]
                    else:
                        return idx
            
            Output.error("Invalid choice, please try again", prefix="✗")
    
    @staticmethod
    def number(
        question: str,
        default: Optional[float] = None,
        min_value: Optional[float] = None,
        max_value: Optional[float] = None,
        int_only: bool = False
    ) -> float:
        """
        Get numeric input with validation.
        
        Args:
            question: The question to ask
            default: Default value
            min_value: Minimum allowed value
            max_value: Maximum allowed value
            int_only: Only allow integers
        
        Returns:
            Numeric value (int or float)
        """
        prompt_parts = [question]
        
        if min_value is not None and max_value is not None:
            prompt_parts.append(f"[{min_value}-{max_value}]")
        elif min_value is not None:
            prompt_parts.append(f"[min: {min_value}]")
        elif max_value is not None:
            prompt_parts.append(f"[max: {max_value}]")
        
        if default is not None:
            prompt_parts.append(f"[{default}]")
        
        prompt_parts.append(": ")
        full_prompt = " ".join(prompt_parts)
        
        while True:
            response = input(full_prompt).strip()
            
            if not response and default is not None:
                return default
            
            try:
                if int_only:
                    value = int(response)
                else:
                    value = float(response)
                
                if min_value is not None and value < min_value:
                    Output.error(f"Value must be at least {min_value}", prefix="✗")
                    continue
                
                if max_value is not None and value > max_value:
                    Output.error(f"Value must be at most {max_value}", prefix="✗")
                    continue
                
                return value
            
            except ValueError:
                Output.error("Please enter a valid number", prefix="✗")