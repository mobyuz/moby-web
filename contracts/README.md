# Moby API contract

`moby-api.openapi.json` pins the Wb0 contract to Moby API version `0.1.0` at
commit `2de25f19aa2fcf91ee95fabea8e187a7f78c4fa3`. The upstream contract is
GPL-3.0-only. [Upstream OpenAPI document](https://github.com/mobyuz/moby-api/blob/2de25f19aa2fcf91ee95fabea8e187a7f78c4fa3/openapi.json)

To update the contract, copy `openapi.json` from the approved API release,
record the source here, and run `npm run api:generate`. Update the snapshot
and `src/api/schema.d.ts` in the same pull request. `npm run api:check` checks
that the declarations match the pinned contract.

Wb2 will pick up `POST /v1/demo/chat` from the B6 release.
