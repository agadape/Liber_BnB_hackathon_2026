# Liber frontend refinement — 5 October 2026

## Direction

Enrich the existing interface without replacing its identity. Keep warm paper, forest green, Newsreader/Bricolage, comic illustrations, existing navigation labels and route slugs. Favor short, useful copy over a long sales pitch. Marketing surfaces use modest variation (5), restrained motion (3), and moderate density (5). Payment forms retain predictable layouts and exact authority boundaries.

## References actually used

- [Taste Skill v2](https://github.com/Leonxlnx/taste-skill/blob/main/skills/taste-skill/SKILL.md): contextual marketing layout, typography, rhythm and restrained motion. Existing brand and original illustrations take precedence over generic defaults.
- [Redesign Existing Projects](https://github.com/Leonxlnx/taste-skill/blob/main/skills/redesign-skill/SKILL.md): audit first, preserve existing behavior, repair incomplete states and hierarchy.
- [Vercel Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines/blob/main/command.md): keyboard controls, focus, labels, status announcements, touch targets, wrapping and reduced motion.
- [Vercel React Best Practices](https://github.com/vercel-labs/agent-skills/blob/main/skills/react-best-practices/SKILL.md): server-rendered content and small client islands; no animation dependency added.
- Installed Next 16.3.8 docs: server/client boundaries, CSS ordering and the not-found convention. Public UI sources were read as guidance; no arbitrary installer was run.

## Changes

1. Root landing: original hero artwork retained; working buyer/merchant/recovery entry points, illustrated scenario, interactive protocol guide, two historical receipt links and native FAQ.
2. Ghost overview: task-oriented workspace links, token preparation, protocol lifecycle and visible evidence. Guide never creates a signed QR or implies a funded reservation.
3. Issue/redeem/history: state-derived progress, role-specific original illustrations and preflight context. Merchant input keeps its own accessible name and a separate description. Invalid reservation links lead to recovery rather than a new issuance form.
4. Demo: each selection uses `/demo?view=…`, so share/back navigation preserves the chosen flow. Final film, deck and separate reclaim receipt are directly accessible.
5. QRIS and BNB workspaces: actual-state progress, more consistent forms and illustrated guidance. Legacy contracts remain separate from Ghost.
6. Common shell: sticky navigation, footer, keyboard focus, loading skeletons, error recovery, custom missing-page view, 44px interaction targets and 16px mobile inputs. Reduced-motion preference suppresses animation; export print output hides navigation/footer.
7. Receipts/checkouts: loading UI; query-key remounts prevent a previous invoice/voucher from appearing as a newly selected reference. Wallet home distinguishes a failed balance/history read from zero/empty results and exposes Ghost directly.
8. Published submission links centralized in `project-links.ts`; repository submission copy now points to the actual final YouTube, public Drive deck and submitted project.

## Visual system

| Token | Value |
|---|---|
| Paper | `#f5f3e9` |
| Surface | `#fffdf7` |
| Forest | `#193f2d` |
| Accent | `#0b6b4e` |
| Muted text | `#536158` |
| Soft green | `#e8ecdf` |
| Desktop panel/control/action radius | 20px / 10px / pill |
| Header/bottom navigation stacking | 30 / 40; dialogs retain native top layer |

`polish.css` loads after the original global styles. Structural content is server rendered; only the lifecycle guide adds local interaction state. Illustrations remain repository assets. No Motion/GSAP/icon package or new payment service was introduced.

## Checks actually performed

- Windows protocol check initially detected CRLF/LF differences in the two generated constant files. Their line endings are now pinned to LF in `.gitattributes`; no protocol values changed. The exact generator check passes.
- Existing frontend suite: **61/61 passed**. Typecheck and production build passed; all 26 pages generated. Lint has no errors and three existing native-QR-image warnings (profile, invoice QR and provider QR); active QR images deliberately retain their direct browser rendering.
- Browser audit: 320px root/Ghost/demo/pilot/merchant/onboarding/funds/redeem/history/terms/proof/invalid/missing-page views; 390px demo variants, provider checkout/receipt, token checkout/receipt and invalid voucher; 768px and 1024px layouts. No horizontal overflow observed in those states.
- Actual interactions: all lifecycle stages, native FAQ click/Enter, mobile menu, demo URL selection and browser Back; device test wallet connected locally, invalid merchant address rejected before signing. No approval, signature, reserve, redeem, faucet or payment was submitted.
- Public API receipt responds with redeemed state and two proofs. Local port 3002 is outside its CORS allowlist, so local receipt UI correctly exposes the unavailable-history state. Production receipt rendering must be checked after deployment; backend CORS is not widened for this visual task.
- Protected account pages require an authenticated user session. Their shared styling, fallback state and source/build were inspected; this session does not claim a new authenticated wallet walkthrough or physical phone-off test.

## Remaining boundaries

Testnet only, MockUSDC has no cash value, buyer preparation online, merchant redemption online with gas. Physical whole-device-off/printed-paper tests and independent security review remain pending. Progress labels reflect current UI readiness, not proof of delivery, fiat settlement or a completed transaction. Deployment results are recorded in the implementation ledger after publication.
