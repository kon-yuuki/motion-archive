export const metadata = {
  slug: "blur-dissolve",
  category: "text-reveals",
  title: "Blur dissolve",
  subtitle: "輪郭をほどいて、余韻を残す",
  description:
    "はっきりした文字が細かな粒のようににじみ、ゆっくり消えていく。文字が出現する動きと対になる「消え方」を、クリックとReplayで確かめるスタディです。",
  trigger: "Click / Replay",
  duration: "1,800ms（デモ調整値）",
  easing: "Progressive diffusion / alpha fade",
  status: "WIP",
  source: {
    name: "Black Dog",
    url: "https://blackdogstory.com/",
    awardUrl: "https://www.awwwards.com/sites/black-dog",
    awardDate: "2021-09-11",
    observedAt: "2026-10-02",
    observationMode: "recording-observed",
    recordingUrl:
      "https://www.awwwards.com/inspiration/black-dog-blurred-text-effect-click-animation",
    location: "タイトルをクリックした後の、文字がにじんで消える場面",
    observation:
      "Awwwardsの約2.77秒の公式記録映像を確認しました。黒い背景の中央にある鮮明な文字が、クリック表示の後に粒状のぼけへ変わり、輪郭を失いながら暗く消えていきます。",
    evidence: [
      "公式映像の開始時、約1秒、約2秒のフレームを比較。文字の輪郭、粒状のにじみ、消失を確認。",
    ],
  },
  takeaways: [
    "文字が読める状態を最初に確保し、その後に輪郭だけをほどいていきます。",
    "小さな粒の位置と透明度をずらすと、単純なフェードよりも形がほどける印象になります。",
    "文字の意味は常にHTMLに残し、描画するのは見た目のコピーだけです。",
  ],
  limitations: [
    "公式記録映像を観察した再現で、元サイトへのクリック操作や現在の稼働状態を確認したものではありません。",
    "記録で確認したのは文字の消失です。出現へ逆再生した動きや、次のシーンの表示は原作の観察結果として含めていません。",
    "原作のWebGL表現に対し、このデモはCanvas 2Dの点とblurで近似しています。粒の分布・時間・文章は独自のものです。",
  ],
  usability: {
    benefit:
      "短いタイトルの区切りや、次の場面へ渡す余韻をつくれます。読み終わってから操作するので、内容を読む時間を奪いません。",
    caution:
      "本文や操作の説明を自動で消すと、読み直せなくなります。ここでは短い装飾用見出しだけを対象にし、Resetでいつでも戻せます。",
    smallScreen:
      "ネイティブのボタンで開始するため、タップとキーボードの両方で操作できます。画面幅に合わせて文字サイズと描画密度を調整します。",
    reducedMotion:
      "粒の拡散を省き、見た目を即座に切り替えます。意味を持つHTMLの見出しと状態表示は残ります。",
  },
  implementation: [
    "オフスクリーンCanvasへ独自の文字を描き、アルファ値のある場所を2px間隔で拾います。",
    "文字の描画は序盤で薄くし、同じ位置から生まれる点を短い距離だけ散らします。点ごとにわずかな遅延を付けています。",
    "画面のCanvasはdevicePixelRatioを最大2に制限します。ResizeObserverで再生成し、終了後の描画ループは停止します。",
    "Reset・連続Replay・画面離脱で前のrequestAnimationFrameを止めます。元のHTMLテキストは分割も書き換えもしません。",
  ],
  xPost:
    "文字が、輪郭を失いながら消えていく。短いタイトルの終わりに余韻をつくる、粒状のぼかし。読む時間はユーザーに任せ、文字の意味はHTMLに残す。",
};
