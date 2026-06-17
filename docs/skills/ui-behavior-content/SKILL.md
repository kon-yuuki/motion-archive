---
name: ui-behavior-content
description: Create and review UI behavior demos and X posts about small usability details in Web UI, such as tooltip timing, hover intent, modal behavior, toast timing, button states, form errors, dropdowns, bottom sheets, and microinteractions. Use designer-friendly Japanese, compare poor and improved behavior, and explain why the behavior feels easier to use.
---

# ui-behavior-content

## Purpose

Create and review UI Gallery content that explains small Web UI behavior details through working demos and X posts. The goal is not flashy motion alone; explain why the behavior helps people use the UI with less confusion, interruption, unreadable content, broken states, or uncertainty.

This skill is for UI Gallery content. Do not apply it to Motion Archive work unless the user explicitly asks.

## When to use this skill

Use this skill when the task involves:

- Adding or improving a UI behavior demo.
- Turning a UI Gallery demo into X post copy.
- Comparing poor and improved UI behavior.
- Rewriting UI behavior explanations in designer-friendly Japanese.
- Adding implementation notes to a UI behavior demo.
- Reviewing tooltip timing, hover intent, edge collision, toast timing, modal behavior, button states, form errors, dropdowns, bottom sheets, tabs, accordions, skeletons, or similar microinteractions.

## Positioning

Write from this position:

- A frontend engineer who validates small usability details in Web UI with working demos.
- Someone who decomposes how UI feels during operation, not only how it looks.
- Someone who explains small UI discomfort with demos and implementation perspective.

## Output principles

- Start from what the user experiences: easy to use, clear, readable, not interruptive, state is understandable, does not break during operation.
- Compare poor behavior and improved behavior whenever possible.
- Explain what gets better for the user, not only what changed visually.
- Keep accessibility as a foundation, but do not lead with specialist terms.
- Put technical terms in implementation notes or supplementary text when needed.
- Include a concrete implementation perspective.
- Preserve the repository's existing structure and style. Avoid broad refactors.

## Tone rules

Write mainly in Japanese.

Prefer:

- こうすると使いやすくなる
- hoverだけに頼ると、スマホやキーボード操作で伝わりにくい
- 読もうとした瞬間に消えるので、少しストレスになりやすい
- 見た目では伝わっていても、実装上は説明との関係が曖昧になりやすい
- 重要な情報なら、隠しすぎず本文側に出した方が安全

Avoid:

- この実装はアクセシビリティ的にダメ
- hover依存はNG
- ariaが足りない
- これはUXが悪い
- Abstract UX commentary without demo-specific implementation points.

## Demo page structure

When creating or reviewing a demo page, aim to include:

1. What behavior the demo validates.
2. Common behavior that feels difficult to use.
3. Improved behavior.
4. Why the improved behavior is easier to use.
5. Implementation points to watch.
6. Notes for mobile or narrow screens.
7. Short X post copy.

Implementation notes can mention terms such as WCAG, ARIA, focus management, collision detection, and prefers-reduced-motion, but only after the user-facing explanation is clear.

## X post formats

### 比較デモ型

```text
〇〇の挙動を3パターンで比較しました。

❌ A
問題点

❌ B
問題点

✅ C
改善点

UIの使いやすさは、
見た目より“〇〇”で変わることが多い。
```

### あるある改善型

```text
〇〇が使いにくくなる原因。

・〇〇
・〇〇
・〇〇

改善するなら、

・〇〇
・〇〇
・〇〇

小さいUIほど、
こういう細かい配慮が体験に出る。
```

### チェックリスト型

```text
〇〇 UIを作るときに確認したいこと

・〇〇できるか
・〇〇で破綻しないか
・〇〇が伝わるか
・〇〇時も自然か
・スマホでも成立するか

“作れた”ではなく、
“使う場面で困らないか”まで見る。
```

### 実装メモ型

```text
〇〇の挙動を作るとき、
実装ではこのあたりを見る。

・表示位置
・遅延時間
・閉じる条件
・画面端の処理
・スクロール時の追従
・スマホ時の代替UI

UIの実装は、見た目より例外処理で差が出る。
```

## Good themes

- Tooltip Behavior
- Hover Intent
- Edge Collision
- Toast Timing
- Modal Open / Close Behavior
- Button Loading State
- Form Error Behavior
- Dropdown Menu Behavior
- Bottom Sheet Behavior
- Cursor Follow UI
- Scroll-Aware Header
- Tab State
- Accordion Timing
- Smart Dropdown
- Form Submit Feedback
- Empty State
- Skeleton / Loading Behavior

## Avoided themes

- Pure visual redesign without behavior comparison.
- Flashy motion that does not improve usability.
- Overseas UI trend summaries without a working demo.
- Accessibility policing tone.
- Examples that are so broken that the comparison feels unrealistic.
- Broad Motion Archive experiments unless explicitly requested.

## Checklist for reviewing output

- Is it scoped to UI Gallery when the request is about UI behavior content?
- Does it compare poor and improved behavior?
- Does it explain the user benefit in plain Japanese?
- Does it avoid leading with technical terms?
- Does it include implementation notes?
- Does it mention mobile, narrow screens, edges, or state changes when relevant?
- Does it avoid unnecessary refactoring?
- Can the X post stand alone without the full article?

## Example outputs

### Tooltip Behavior post

```text
ツールチップの出方を3パターンで比較しました。

❌ すぐ出る
少し触れただけでも表示されて、操作の邪魔になりやすい。

❌ 毎回遅れる
連続で確認したいときに、待ち時間が積み重なる。

✅ 初回だけ少し待つ
誤表示を減らしつつ、操作中は軽く感じられる。

UIの使いやすさは、
見た目より“出るタイミング”で変わることが多い。
```

### Implementation note sample

```text
実装では、表示までの遅延、閉じる条件、画面端での表示位置、キーボード操作時の見え方を確認します。
専門的には collision detection や focus management の話ですが、まずは「読める位置に出て、操作中に邪魔しないか」を見るのが大事です。
```

