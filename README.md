# Ecommerce skills for Claude

Six skills Claude (and other coding agents) load when working on an online store. Each is a `SKILL.md` with the rules, plus the code and prompts it uses.

| Skill | Use it for | Tools in the folder |
|---|---|---|
| [`ecomm-copy`](skills/ecomm-copy/SKILL.md) | Headlines, pages, ads, emails, test arms. Breakthrough Advertising, Propaganda, the sales books, a copy brief | |
| [`ecomm-email`](skills/ecomm-email/SKILL.md) | HTML emails the LiftLike way: shell, voice, lists, automations, flows, sending rules | `shell.ts` (render, merge fields, list split), `shell.test.ts`, `preview.ts` |
| [`ecomm-screens`](skills/ecomm-screens/SKILL.md) | Landing page, product page, cart, checkout, thank-you. Built as section lists so they can be tested | `design.md` |
| [`ecomm-experiments`](skills/ecomm-experiments/SKILL.md) | A/B tests and ramps on screens and emails: who owns what, the state machine, price tests | `EXPERIMENTS.md` ledger, `SCAN.md` and `DRAFT.md` routine prompts, `experiment_readout.pipe` |
| [`ecomm-checkout`](skills/ecomm-checkout/SKILL.md) | Stripe checkout, orders, bundles, bumps, upsells, price ladder, reprice checklist | |
| [`ecomm-stack`](skills/ecomm-stack/SKILL.md) | Cloudflare + Stripe + Tinybird engineering rules, store tables, events, compliance | `templates/` (Worker, auth, wrangler config), `references/` |

## Install

```bash
for s in ~/ecomm-playbook/skills/*/; do
  n=$(basename "$s")
  ln -sfn "$s" ~/.agents/skills/"$n"                  # Codex, Cursor, Gemini CLI, OpenCode
  ln -sfn ../../.agents/skills/"$n" ~/.claude/skills/"$n"   # Claude Code
  ln -sfn ../../../.agents/skills/"$n" ~/.codeium/windsurf/skills/"$n"   # Windsurf
done
```

The links point at this checkout, so an edit here is live in the next session.

## Check

```bash
bun test skills                                  # the email shell
bun skills/ecomm-email/preview.ts <email module> # render an email to .preview/
```

The stack and the plain-SQL, no-framework approach come from Blake Anderson's [ai-app-playbook](https://github.com/blakeandersonw/ai-app-playbook) (MIT). The experiment ownership, pricing, and email rules come from running LiftLike.

MIT © Blake Anderson, with modifications © Damon Deng
