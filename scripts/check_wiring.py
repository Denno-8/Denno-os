"""
Static wiring checker for the Denno backend.

What this catches: a route calling `service.foo()` where the service class
has no `foo` method (typo, renamed method, copy-paste from another module),
and the same for service -> repository calls. This is exactly the class of
bug that `py_compile` (syntax only) and even a real test suite with mocked
dependencies can miss if the mock is too permissive.

What this does NOT catch: actual runtime behavior, Mongo query correctness,
Pydantic validation errors, or anything that requires executing the code.
This sandbox has no network access to install fastapi/motor/pydantic, so a
real boot test isn't possible here — this is the strongest static
alternative available without those packages installed.

Method: regex-based source scanning, not full type inference. It resolves
`service.method()` / `self.repo.method()` calls back to a class by reading
the `Depends(get_service) -> XService` return-type hints in routes.py, and
the `self.repo = XRepository(db)` assignment in each service's __init__.
This is intentionally simple and inspectable rather than clever.
"""
import ast
import re
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent / "backend" / "app"


def class_methods(pyfile: Path) -> dict[str, set[str]]:
    """Returns {ClassName: {method_names}} for every class defined in a file."""
    tree = ast.parse(pyfile.read_text(encoding="utf-8"))
    result: dict[str, set[str]] = {}
    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef):
            methods = {
                n.name for n in node.body
                if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))
            }
            result[node.name] = methods
    return result


def build_class_index(folder: Path) -> dict[str, set[str]]:
    """Merges class->methods across every file in a folder (services/ or repositories/)."""
    index: dict[str, set[str]] = {}
    for pyfile in folder.glob("*.py"):
        if pyfile.name == "__init__.py":
            continue
        index.update(class_methods(pyfile))
    return index


def check_routes_to_services(services_index: dict[str, set[str]]) -> list[str]:
    errors = []
    for routes_file in (BACKEND / "api").glob("*/routes.py"):
        text = routes_file.read_text(encoding="utf-8")

        # Find "-> XService:" return type hints to know which class 'service' resolves to.
        return_types = set(re.findall(r"->\s*(\w*Service)\s*:", text))
        if not return_types:
            continue  # module with no service dependency (e.g. a pure passthrough)

        # Find every `service.method_name(` call.
        calls = set(re.findall(r"\bservice\.(\w+)\(", text))

        for cls in return_types:
            if cls not in services_index:
                errors.append(f"{routes_file.relative_to(BACKEND)}: return type '{cls}' has no matching class in app/services/")
                continue
            known_methods = services_index[cls]
            for method in calls:
                if method not in known_methods:
                    errors.append(
                        f"{routes_file.relative_to(BACKEND)}: calls service.{method}() "
                        f"but {cls} has no such method (has: {sorted(known_methods)})"
                    )
    return errors


def check_services_to_repositories(repos_index: dict[str, set[str]]) -> list[str]:
    errors = []
    for service_file in (BACKEND / "services").glob("*.py"):
        if service_file.name == "__init__.py":
            continue
        text = service_file.read_text(encoding="utf-8")

        # Find `self.<attr> = XRepository(db)` / `self.<attr> = XService(db)` assignments.
        attr_to_class = dict(re.findall(r"self\.(\w+)\s*=\s*(\w+)\(db\)", text))

        # Find every `self.<attr>.<method>(` call.
        calls = re.findall(r"self\.(\w+)\.(\w+)\(", text)

        for attr, method in calls:
            cls = attr_to_class.get(attr)
            if cls is None:
                continue  # not a repo/service attribute (e.g. self.col from a repository file itself)
            if cls in repos_index:
                known_methods = repos_index[cls]
            else:
                continue  # cross-service calls (e.g. JobService -> ApplicationService) checked separately below
            if method not in known_methods:
                errors.append(
                    f"{service_file.relative_to(BACKEND)}: calls self.{attr}.{method}() "
                    f"but {cls} has no such method (has: {sorted(known_methods)})"
                )
    return errors


def check_cross_service_calls(services_index: dict[str, set[str]]) -> list[str]:
    """Specifically checks service->service calls, e.g. JobService calling ApplicationService."""
    errors = []
    for service_file in (BACKEND / "services").glob("*.py"):
        if service_file.name == "__init__.py":
            continue
        text = service_file.read_text(encoding="utf-8")
        attr_to_class = dict(re.findall(r"self\.(\w+)\s*=\s*(\w+)\(db\)", text))
        calls = re.findall(r"self\.(\w+)\.(\w+)\(", text)
        for attr, method in calls:
            cls = attr_to_class.get(attr)
            if cls in services_index:
                known_methods = services_index[cls]
                if method not in known_methods:
                    errors.append(
                        f"{service_file.relative_to(BACKEND)}: calls self.{attr}.{method}() "
                        f"but {cls} (a Service) has no such method (has: {sorted(known_methods)})"
                    )
    return errors


def check_router_registration() -> list[str]:
    """Every routes.py under api/*/ should be imported and include_router()'d in router.py."""
    errors = []
    router_text = (BACKEND / "api" / "router.py").read_text(encoding="utf-8")
    for routes_file in (BACKEND / "api").glob("*/routes.py"):
        module_name = routes_file.parent.name
        if module_name == "auth":
            expected_import = "app.api.auth.routes"
        else:
            expected_import = f"app.api.{module_name}.routes"
        if expected_import not in router_text:
            errors.append(f"{routes_file.relative_to(BACKEND)}: not imported in api/router.py")
    return errors


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    services_index = build_class_index(BACKEND / "services")
    repos_index = build_class_index(BACKEND / "repositories")

    all_errors = []
    all_errors += check_routes_to_services(services_index)
    all_errors += check_services_to_repositories(repos_index)
    all_errors += check_cross_service_calls(services_index)
    all_errors += check_router_registration()

    print(f"Scanned {len(services_index)} service classes, {len(repos_index)} repository classes.")
    print(f"Checked {len(list((BACKEND/'api').glob('*/routes.py')))} route files.\n")

    if all_errors:
        print(f"❌ {len(all_errors)} wiring issue(s) found:\n")
        for e in all_errors:
            print(f"  - {e}")
        return 1

    print("✅ All route -> service, service -> repository, and service -> service calls resolve to real methods.")
    print("✅ All routers are registered in api/router.py.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
