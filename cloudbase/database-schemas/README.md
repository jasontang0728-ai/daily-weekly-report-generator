# Database Schemas

CloudBase CLI uses this directory when pulling or pushing local data models.

Reference commands from the official docs:

- `tcb db model pull -d ./cloudbase/database-schemas -e your-env-id`
- `tcb db model push -d ./cloudbase/database-schemas -e your-env-id`

This repository does not commit guessed model JSON before the first real CloudBase environment pull. The first production-ready model files should be pulled from or validated against the target environment, then committed here.
