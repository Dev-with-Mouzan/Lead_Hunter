import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SERVER = os.path.join(ROOT, "server")
for _p in (ROOT, SERVER):
    if _p not in sys.path:
        sys.path.insert(0, _p)

from appSetup import buildApp  # noqa: E402

app = buildApp