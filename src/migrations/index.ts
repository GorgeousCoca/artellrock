import * as migration_20261011_161443_initial from './20261011_161443_initial';
import * as migration_20261011_205333_calculator from './20261011_205333_calculator';
import * as migration_20261012_190421_specs from './20261012_190421_specs';
import * as migration_20261013_181500_projects_sort from './20261013_181500_projects_sort';
import * as migration_20261017_041900_contact_telegram from './20261017_041900_contact_telegram';

export const migrations = [
  {
    up: migration_20261011_161443_initial.up,
    down: migration_20261011_161443_initial.down,
    name: '20261011_161443_initial',
  },
  {
    up: migration_20261011_205333_calculator.up,
    down: migration_20261011_205333_calculator.down,
    name: '20261011_205333_calculator',
  },
  {
    up: migration_20261012_190421_specs.up,
    down: migration_20261012_190421_specs.down,
    name: '20261012_190421_specs'
  },
  {
    up: migration_20261013_181500_projects_sort.up,
    down: migration_20261013_181500_projects_sort.down,
    name: '20261013_181500_projects_sort'
  },
  {
    up: migration_20261017_041900_contact_telegram.up,
    down: migration_20261017_041900_contact_telegram.down,
    name: '20261017_041900_contact_telegram'
  },
];
