# Moby API contract

`moby-api.openapi.json` pins the B6 contract to Moby API version `0.1.0` at
commit `8b7fd3675cb52810cd27453aaa28de5336b8cfcf`. The upstream contract is
GPL-3.0-only. [Upstream OpenAPI document](https://github.com/mobyuz/moby-api/blob/8b7fd3675cb52810cd27453aaa28de5336b8cfcf/openapi.json)

To update the contract, copy `openapi.json` from the approved API release,
record the source here, and run `npm run api:generate`. Update the snapshot
and `src/api/schema.d.ts` in the same pull request. `npm run api:check` checks
that the declarations match the pinned contract.

The website uses `POST /v1/demo/chat` for its guest demo.
