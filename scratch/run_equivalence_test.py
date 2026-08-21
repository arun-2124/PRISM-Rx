import os, sys, unittest
sys.path.insert(0, '.')

if os.path.exists('.env'):
    with open('.env') as f:
        for line in f:
            if line.strip() and not line.startswith('#') and '=' in line:
                k, v = line.strip().split('=', 1)
                os.environ[k] = v.strip('\"\'')

os.environ['RUN_POSTGRES_EQUIVALENCE_TESTS'] = '1'

from tests.test_sqlite_postgres_equivalence import TestSQLitePostgresEquivalence

suite = unittest.TestLoader().loadTestsFromTestCase(TestSQLitePostgresEquivalence)
runner = unittest.TextTestRunner(verbosity=2)
result = runner.run(suite)

if result.wasSuccessful():
    print("\nSUCCESS: All PostgreSQL Equivalence tests passed 100%!")
else:
    print("\nFAILURE: Some equivalence tests failed.")
