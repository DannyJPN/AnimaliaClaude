# Test Data

This directory contains test data files used by the test data seeder service.

## Structure

- `tenants/` - Test tenant configurations and data
- `users/` - Test user accounts for different scenarios
- `specimens/` - Sample specimen data for testing
- `species/` - Test species data
- `organizations/` - Test organization structures

## Usage

The test data seeder service automatically loads data from this directory when the test environment starts up.

Files should be in JSON format and follow the schema expected by the application models.