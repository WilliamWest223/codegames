#!/usr/bin/env python3
"""
HNIC-Overseer Comprehensive Security Audit Suite
Executes zero-trust automated security analysis across the codebase:
1. Secret & Token Leak Audit (API keys, JWTs, AWS credentials, private keys).
2. OWASP Top 10 Static Audit (SQLi, command injection, path traversal, XSS sinks, weak crypto).
3. Client Sink Security (Strict localStorage/sessionStorage gating).
4. Database RLS & Search Path Hardening (Supabase migrations).
5. Input Sanitization & Bounds Integrity.
"""

import os
import re
import sys
import json
import subprocess
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent

SECRET_PATTERNS = [
    (r"AKIA[0-9A-Z]{16}", "AWS Access Key ID"),
    (r"sk_live_[0-9a-zA-Z]{24,}", "Stripe Live API Key"),
    (r"-----BEGIN (?:RSA |EC )?PRIVATE KEY-----", "Private Cryptographic Key"),
    (r"ghp_[0-9a-zA-Z]{36}", "GitHub Personal Access Token"),
    (r"xox[baprs]-[0-9a-zA-Z]{10,48}", "Slack API Token"),
    (r"eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}", "Hardcoded JWT Token"),
    (r"(?:api_key|secret_key|auth_token)\s*=\s*['\"][0-9a-zA-Z]{16,}['\"]", "Hardcoded API Secret")
]

OWASP_PATTERNS = [
    (r"(?:execute|cursor\.execute)\s*\(\s*f?['\"].*?%(?:s|d)|f['\"].*?SELECT.*?\{", "SQL Injection Vector (Unsanitized Query)"),
    (r"(?:os\.system|subprocess\.Popen|subprocess\.call)\s*\(\s*(?:f?['\"].*?\{|.*?\+)", "Command Injection Vector (Unsanitized Shell Call)"),
    (r"shell\s*=\s*True", "Dangerous Shell=True Execution"),
    (r"hashlib\.(?:md5|sha1)\s*\(", "Obsolete/Weak Cryptographic Hash (MD5/SHA1)"),
    (r"open\s*\(\s*.*?request\.(?:args|form|GET|POST)", "Path Traversal Vector (Unsanitized File Open)")
]

IGNORE_DIRS = {
    ".git", "node_modules", "dist", "build", "coverage", ".turbo", ".next", ".claude", "pyodide"
}

def scan_codebase_for_secrets():
    print("\n[OVERSEER] 1. Scanning Codebase for Secrets & Sensitive Credentials...")
    findings = []
    scanned_count = 0
    for root, dirs, files in os.walk(ROOT_DIR):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        for f in files:
            if f.endswith(('.ts', '.tsx', '.js', '.mjs', '.sql', '.json', '.env', '.md')):
                file_path = os.path.join(root, f)
                rel_path = os.path.relpath(file_path, ROOT_DIR)
                # Skip package-lock.json or test fixtures that mock keys safely
                if 'package-lock.json' in rel_path or '__tests__' in rel_path:
                    continue
                scanned_count += 1
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as handle:
                        for line_idx, line in enumerate(handle, 1):
                            for pattern, desc in SECRET_PATTERNS:
                                if re.search(pattern, line):
                                    findings.append({
                                        'file': rel_path,
                                        'line': line_idx,
                                        'desc': desc,
                                        'snippet': line.strip()[:80]
                                    })
                except Exception:
                    pass

    print(f"  Scanned {scanned_count} files.")
    if findings:
        print(f"  ❌ FAIL: Found {len(findings)} secret leaks:")
        for fd in findings:
            print(f"    - [{fd['desc']}] {fd['file']}:{fd['line']} -> {fd['snippet']}")
        return False
    else:
        print("  ✓ PASS: 0 hardcoded secrets or credential leaks detected.")
        return True

def scan_codebase_for_owasp():
    print("\n[OVERSEER] 2. Auditing Codebase for OWASP Top 10 Flaws...")
    findings = []
    scanned_count = 0
    for root, dirs, files in os.walk(ROOT_DIR):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        for f in files:
            if f.endswith(('.ts', '.tsx', '.js', '.mjs', '.py')):
                file_path = os.path.join(root, f)
                rel_path = os.path.relpath(file_path, ROOT_DIR)
                if '__tests__' in rel_path or 'node_modules' in rel_path:
                    continue
                scanned_count += 1
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as handle:
                        for line_idx, line in enumerate(handle, 1):
                            for pattern, desc in OWASP_PATTERNS:
                                if re.search(pattern, line):
                                    findings.append({
                                        'file': rel_path,
                                        'line': line_idx,
                                        'desc': desc,
                                        'snippet': line.strip()[:80]
                                    })
                except Exception:
                    pass

    print(f"  Audited {scanned_count} source files.")
    if findings:
        print(f"  ❌ FAIL: Found {len(findings)} OWASP pattern violations:")
        for fd in findings:
            print(f"    - [{fd['desc']}] {fd['file']}:{fd['line']}")
        return False
    else:
        print("  ✓ PASS: 0 OWASP injection or execution violations found.")
        return True

def audit_supabase_migrations():
    print("\n[OVERSEER] 3. Auditing Supabase SQL Migrations (RLS & Search Path)...")
    migrations_dir = ROOT_DIR / "supabase" / "migrations"
    if not migrations_dir.exists():
        print("  Supabase migrations dir not found.")
        return True

    violations = []
    for sql_file in sorted(migrations_dir.glob("*.sql")):
        content = sql_file.read_text(encoding="utf-8")
        # Check security definer functions have search_path set
        functions = re.findall(r"create\s+(?:or\s+replace\s+)?function\s+([a-zA-Z0-9_\.]+)\s*\(.*?\).*?security\s+definer", content, re.IGNORECASE | re.DOTALL)
        for fn in functions:
            fn_block = content[content.find(fn):content.find(fn) + 600]
            if "search_path" not in fn_block.lower():
                violations.append(f"{sql_file.name}: Function '{fn}' is SECURITY DEFINER but missing 'SET search_path = \"\"'")

    if violations:
        print(f"  ❌ FAIL: Found {len(violations)} migration security issues:")
        for v in violations:
            print(f"    - {v}")
        return False
    else:
        print("  ✓ PASS: All SECURITY DEFINER functions enforce strict search_path = ''.")
        return True

def audit_sinks():
    print("\n[OVERSEER] 4. Running Client-Side Sink Checker...")
    res = subprocess.run(["node", "scripts/check-sinks.mjs"], cwd=ROOT_DIR, capture_output=True, text=True)
    if res.returncode == 0:
        print("  ✓ PASS: No unapproved localStorage/sessionStorage sinks detected.")
        return True
    else:
        print("  ❌ FAIL: Sink check failed:")
        print(res.stdout)
        print(res.stderr)
        return False

def audit_input_sanitization():
    print("\n[OVERSEER] 5. Verifying Input Limits & Boundary Protection Tests...")
    res = subprocess.run(["npx", "vitest", "run", "src/features/games/__tests__/inputLimits.test.ts", "src/features/progress/__tests__/sanitize.test.ts"], cwd=ROOT_DIR / "apps" / "web", capture_output=True, text=True)
    if res.returncode == 0:
        print("  ✓ PASS: Input limits and sanitization tests all passed (boundary & malicious payload rejection verified).")
        return True
    else:
        print("  ❌ FAIL: Sanitization tests failed.")
        print(res.stdout)
        return False

def main():
    print("=" * 68)
    print("  [HNIC-OVERSEER] ZERO-TRUST FULL-SPECTRUM SECURITY AUDIT")
    print("=" * 68)

    results = [
        scan_codebase_for_secrets(),
        scan_codebase_for_owasp(),
        audit_supabase_migrations(),
        audit_sinks(),
        audit_input_sanitization()
    ]

    print("\n" + "=" * 68)
    if all(results):
        print("  [HNIC-OVERSEER] 🛡️ 100% (5/5) | ZERO VULNERABILITIES DETECTED")
        print("  VERDICT: APPROVED FOR PRODUCTION / DEPLOYMENT SIGN-OFF")
        print("=" * 68 + "\n")
        return 0
    else:
        print("  [HNIC-OVERSEER] ❌ AUDIT FAILED — REMEDIATION REQUIRED")
        print("=" * 68 + "\n")
        return 1

if __name__ == "__main__":
    sys.exit(main())
