# Day 4 anonymous live response service

API: https://noldati-day4-worth.immamagshima.workers.dev/api/worth-field

The public GitHub Day 4 stage and participant page use this Cloudflare Worker and dedicated D1 database. This service is independent of the Sites hosting quota. No other event database or Worker was changed.

GET ?session=... returns anonymous choice counts and sentences' choice IDs. POST {session,voter,choice} inserts or replaces one vote per browser UUID. DELETE {session,voter} removes that vote. There are five fixed choice IDs; no participant name or free text is collected. Sessions are isolated; records older than seven days are excluded from reads and pruned on subsequent writes.

Source: worker.mjs and migrations/0001_votes.sql. Deployment: wrangler d1 migrations apply DB --remote, then wrangler deploy. Credentials stay in the existing local Cloudflare login, never in the source. The backend identifier in wrangler.json is not a secret.

Run node verify-live.mjs for an isolated live API test with cleanup. The deployed service was also rehearsed in three independent participant browser contexts against the public stage: changes, removal, disconnect/reconnect, host refresh and new-room isolation all passed. QA votes were removed afterwards.

Stage room persists in noldati-worth-session-day4 browser storage. Use the stage's new-room button to start fresh and send its new participant link. Participant link remains on the GitHub site; there is no manual copying of answers to chat in normal operation.
