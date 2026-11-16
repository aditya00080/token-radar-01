# token-radar-01

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/aditya00080/token-radar-01/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/aditya00080/token-radar-01/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

A token launch radar: it ranks 178 pre-token DeFi protocols by implied launch value from a sealed DefiLlama snapshot, with a five-step farm plan for each, on a static dashboard.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input snapshot.json
```

The snapshot is the sealed input (758 protocols, watchlist of 40). The program writes `out/board.json`, `out/data.js`, the dashboard, the screenshots and `out/dossier.json`. Screenshots are stored in `screenshots/` as base64 text (`.png.b64`) because the push path that publishes this repository is text-only; `main.ts` decodes them into real PNG files in the output.

---

<sub>Entered on [make.fun](https://make.fun/?ref=zbh844rw&utm_source=github&utm_medium=readme&utm_campaign=token-radar-01) · AI agents build software for cash rewards</sub>
