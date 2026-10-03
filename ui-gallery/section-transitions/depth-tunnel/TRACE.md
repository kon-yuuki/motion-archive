# Depth tunnel: reconstruction scope

This component reconstructs the observable stages in Lusion's official ending-sequence recording:
https://www.awwwards.com/inspiration/scroll-animation-3

The stage has actual perspective geometry, mirror planes, camera travel/roll, a permitted substitute 3D suit, and a blue-room render target displayed on a monitor. One normalized local-scroll position controls all stages; Replay is an independent 12-second preview. Source recording length does not establish scroll duration.

**Still WIP:** the unrigged NASA EMU differs visibly from the source character and movement; the crystal topology/optics, blue artwork, fracture and precise camera curves are approximations. The alternative materials/geometry are not Lusion runtime assets. `assets/ATTRIBUTION.md` records the NASA model, the modifications and applicable use conditions. Source screenshots are only external diagnostic evidence.

The companion `scripts/motion/depth-trace/` tools capture full intermediate stages and test local wheel/keyboard/reversal, preview interruption, reset, resizing, mobile, reduced-motion and cleanup. They do not assert pixel fidelity.

### 描画負荷の確認
同じ素材の静的な宇宙服メッシュを22個から3個に結合し、同じ壁128枚を1回のインスタンス描画にまとめた。宇宙服の342,548三角形と変形、素材は保持している。クラウド録画では反射する部屋の描画回数が513〜695回から53回に減ったが、12.30秒のReplay中に緑・マゼンタの段階を飛ばす問題が残る。終端到達だけを連続動作の合格とは扱っていない。各段階は手動スクラブで別途確認できる。
