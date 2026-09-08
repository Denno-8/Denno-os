"""
Static structural checker for documentation files. Cannot substitute for
an actual Mermaid renderer or Markdown linter (neither is available in
this sandbox — no network to install them, no Chrome for mermaid-cli, no
jsdom for mermaid's parser to run headless). What this DOES catch:

1. Unbalanced brackets/braces/parens inside ```mermaid blocks — the most
   common cause of a diagram silently failing to render.
2. Markdown tables where a data row has a different number of columns
   than its header — renders as a garbled/misaligned table.
3. Unclosed code fences (odd number of ``` markers).
"""
import re
import sys
from pathlib import Path

DOCS = [
    "README.md",
    "docs/ARCHITECTURE.md",
    "docs/API.md",
    "database/SCHEMA.md",
]


def check_mermaid_balance(text: str, filename: str) -> list[str]:
    errors = []
    blocks = re.findall(r"```mermaid\n(.*?)```", text, re.S)
    for i, block in enumerate(blocks):
        # erDiagram cardinality notation (e.g. `||--o{`, `}o--||`) uses '{'/'}'
        # as part of crow's-foot symbols, not as balanced block delimiters —
        # a diagram can have many more '{' than '}' (or vice versa) and still
        # be perfectly valid. Only check brace balance for other diagram types
        # (flowchart, sequenceDiagram) where '{'/'}' really do delimit blocks.
        is_er_diagram = block.strip().startswith("erDiagram")

        for open_c, close_c, name in [("[", "]", "brackets"), ("(", ")", "parens")]:
            if block.count(open_c) != block.count(close_c):
                errors.append(
                    f"{filename}: mermaid block #{i+1} has unbalanced {name} "
                    f"({block.count(open_c)} '{open_c}' vs {block.count(close_c)} '{close_c}')"
                )
        if not is_er_diagram and block.count("{") != block.count("}"):
            errors.append(
                f"{filename}: mermaid block #{i+1} has unbalanced braces "
                f"({block.count('{')} vs {block.count('}')})"
            )
        if block.count('"') % 2 != 0:
            errors.append(f"{filename}: mermaid block #{i+1} has an odd number of double-quotes")
    return errors


def check_code_fences(text: str, filename: str) -> list[str]:
    fence_count = len(re.findall(r"^```", text, re.M))
    if fence_count % 2 != 0:
        return [f"{filename}: odd number of ``` code fence markers ({fence_count}) — one is unclosed"]
    return []


def check_table_columns(text: str, filename: str) -> list[str]:
    errors = []
    lines = text.split("\n")
    in_table = False
    header_cols = None
    for lineno, line in enumerate(lines, 1):
        stripped = line.strip()
        is_table_row = stripped.startswith("|") and stripped.endswith("|")
        is_separator = bool(re.match(r"^\|?[\s:|-]+\|?$", stripped)) and "-" in stripped

        if is_table_row and not is_separator:
            # GFM escapes a literal pipe inside a cell as \| — that must NOT
            # count as a column separator. Temporarily replace escaped pipes
            # with a placeholder before splitting on '|', matching how a
            # real Markdown renderer parses table cells.
            unescaped_for_split = stripped.replace("\\|", "\x00")
            cell_count = len(unescaped_for_split.split("|")) - 2  # minus leading/trailing empty strings
            if not in_table:
                in_table = True
                header_cols = cell_count
            elif header_cols is not None and cell_count != header_cols:
                errors.append(
                    f"{filename}:{lineno}: table row has {cell_count} columns, "
                    f"header had {header_cols}: {stripped[:60]}"
                )
        elif is_separator:
            continue
        else:
            in_table = False
            header_cols = None
    return errors


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    root = Path(__file__).resolve().parent.parent
    all_errors = []
    checked = 0

    for doc in DOCS:
        path = root / doc
        if not path.exists():
            all_errors.append(f"{doc}: FILE NOT FOUND")
            continue
        text = path.read_text(encoding="utf-8")
        checked += 1
        all_errors += check_mermaid_balance(text, doc)
        all_errors += check_code_fences(text, doc)
        all_errors += check_table_columns(text, doc)

    print(f"Checked {checked} documentation files.\n")
    if all_errors:
        print(f"❌ {len(all_errors)} issue(s):\n")
        for e in all_errors:
            print(f"  - {e}")
        return 1

    print("✅ All mermaid blocks balanced, all code fences closed, all tables have consistent column counts.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
