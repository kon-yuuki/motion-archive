# 最後の5件: 原作との比較と残る差

公式の記録映像の静止・途中状態に合わせて再構成した比較です。すべてユーザーレビュー前のWIPです。操作テストの件数は再現度の点数ではありません。

| 対象 | 修正した構成・動き | 残る差 |
|---|---|---|
| [Smooothy](bending-cards.jpg) | 黒い画面、縦長カード、曲面メッシュ、カードと別に回る立体、循環操作 | 立体3点は作者ごとのCC BY 4.0を確認して使用。ケーキ・トースト・ラーメンは独自モデルで形と質感が異なる。ノイズ・骨格・慣性は近似 |
| [De Maldè](ferris-wheel.jpg) | 幅広い絵が細い立体ドラムへ変わる途中形状、上下に残る隣の絵、番号と文字配置 | 絵画は独自生成。原作の動画だけでは入力条件と正確な慣性は確定できない |
| [Akaru](lateral-panels.jpg) | 全高の面が横へ通り抜ける境界、固定見出し、次の面の写真プレビュー | 写真と書体を代替。映像から読んだ区間補間で、原作のイージング定数ではない |
| [Ciel Rose](vertical-aperture.jpg) | 約55%幅の16:9窓、固定目盛り、上下の継ぎ目、曲面のたわみ、往復 | 独自生成した静止画のため、原作の窓の中の動画は再現していない |
| [Lusion](depth-tunnel.jpg) | 人物→反射の部屋→緑の結晶→マゼンタ→青い部屋→画面の外→到着先という立体構成 | **連続再生は不合格**。人物、形状、反射、カメラにも大きな差が残る |

## Lusionの未達部分

人物はNASA / Michael D. Carbajalの未リグEMUモデルを変更した代替です。原作の人物や演技ではありません。静止段階の比較と手動スクラブはできますが、クラウドでの12.3秒のReplayは31フレーム、最大3.2秒の間隔となり、緑・マゼンタの段階を飛ばしました。終点へ着いたことを滑らかな連続動作の合格とはしていません。元の反射や空間密度、人物のポーズも一致していません。

## 確認範囲

- スライダーの個別操作確認: Smooothy16項目、De Maldè16項目、Akaru16項目、Ciel23項目が成功。実タッチのポインター捕捉切替を修正し、前後・循環を再確認
- Lusionの操作・縮小表示・再初期化等32項目は成功。上記の連続再生は失敗。この結果は別に扱う
- 元映像の長さを実際のスクロール時間と取り違えず、観察用Replayと区別する
- 実機スマートフォン、Safari、Firefox、元サイトの全入力条件は未確認
- 最終5ページの本番ビルド統合確認33/33が成功。320px/390pxの横はみ出しなし、axe指摘・JavaScriptエラー・ローカル素材失敗0件。連続再生の忠実度とは別の確認です。詳細は[検証記録](../../ui-motion-verification.md)に記載

比較画像の原作側は以下の短い公式記録映像の必要な段階を引用し、隣に独立実装を示したものです。動作するデモにはこれらの画面や動画を同梱していません。

出典: [Smooothy](https://www.awwwards.com/inspiration/slider-smooothy)、[De Maldè](https://www.awwwards.com/inspiration/ferris-wheel-slider-de-malde-canvas-chronicles)、[Akaru](https://www.awwwards.com/inspiration/slider-akaru-2)、[Ciel Rose](https://www.awwwards.com/inspiration/home-projects-slider-ciel-rose)、[Lusion](https://www.awwwards.com/inspiration/scroll-animation-3)

3D素材とライブラリの権利表記は `public/ui-motion-licenses/assets/` に含め、通常版・共有版の両方から参照できます。写真・絵画・イラストの独自素材は各assets内の説明に来歴を記録しています。
