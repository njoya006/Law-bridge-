"""
Verification script to check if all Django services are set up correctly.
Run after executing setup_django_comprehensive.py
"""

import os
from pathlib import Path


def verify_service_structure():
    """Verify all services have the correct structure."""
    
    base_path = Path(r"c:\Users\njoya\Desktop\Lawbridge\services")
    
    services = {
        "notification-service": "notifications",
        "calendar-service": "calendar",
        "search-service": "search",
        "monitoring-service": "monitoring",
    }
    
    required_files = {
        "core/settings.py",
        "core/urls.py",
        "core/wsgi.py",
        "core/__init__.py",
        "apps/__init__.py",
        "apps/{app}/models.py",
        "apps/{app}/serializers.py",
        "apps/{app}/views.py",
        "apps/{app}/urls.py",
        "apps/{app}/admin.py",
        "apps/{app}/apps.py",
        "apps/{app}/__init__.py",
        "apps/{app}/migrations/__init__.py",
        "tests/__init__.py",
        "requirements.txt",
    }
    
    results = {}
    
    print("\n" + "="*70)
    print("Django Services Structure Verification")
    print("="*70 + "\n")
    
    for service_name, app_name in services.items():
        service_path = base_path / service_name
        results[service_name] = {"exists": True, "files": {}}
        
        if not service_path.exists():
            results[service_name]["exists"] = False
            print(f"❌ {service_name}: Service directory does not exist")
            continue
        
        print(f"✓ {service_name}")
        
        # Check core/asgi.py for monitoring-service only
        if service_name == "monitoring-service":
            asgi_file = service_path / "core" / "asgi.py"
            if asgi_file.exists():
                print(f"  ✓ core/asgi.py (WebSocket support)")
            else:
                print(f"  ⚠ core/asgi.py (missing)")
                results[service_name]["files"]["core/asgi.py"] = False
        
        # Check all required files
        for file_pattern in required_files:
            file_path_str = file_pattern.replace("{app}", app_name)
            file_path = service_path / file_path_str
            
            if file_path.exists():
                results[service_name]["files"][file_path_str] = True
            else:
                results[service_name]["files"][file_path_str] = False
                print(f"  ⚠ Missing: {file_path_str}")
        
        # Check requirements.txt content
        req_file = service_path / "requirements.txt"
        if req_file.exists():
            with open(req_file) as f:
                reqs = f.read().strip().split('\n')
            print(f"  ✓ requirements.txt ({len(reqs)} packages)")
        
        print()
    
    # Summary
    print("="*70)
    all_ok = all(
        all(v.get("files", {}).values())
        for v in results.values()
        if v.get("exists")
    )
    
    if all_ok:
        print("✓ All services are correctly set up!")
    else:
        print("⚠ Some files are missing. Run setup_django_comprehensive.py to complete setup.")
    
    print("="*70 + "\n")
    
    return all_ok


if __name__ == "__main__":
    verify_service_structure()
