import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs py-8 border-t border-slate-800 no-print mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* エコノミークラス症候群予防 */}
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700">
            <h4 className="text-white font-bold mb-2 text-sm text-red-400">
              エコノミークラス症候群 予防の重要ポイント
            </h4>
            <ul className="space-y-1 text-slate-300 list-disc list-inside">
              <li>1時間に1回は車外に出て軽く歩く・足を動かす</li>
              <li>こまめな水分補給（利尿作用のあるお茶やコーヒー以外）</li>
              <li>足首の曲げ伸ばし運動・ふくらはぎのマッサージ</li>
              <li>就寝時は座席をなるべく平らにし、足を高くする</li>
            </ul>
          </div>

          {/* 緊急相談窓口 */}
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700">
            <h4 className="text-white font-bold mb-2 text-sm text-amber-400">
              医療・支援相談窓口
            </h4>
            <div className="space-y-1.5 text-slate-300">
              <div className="flex justify-between">
                <span>現地救護所・本部直通:</span>
                <span className="font-mono text-white font-bold">096-328-2111 (熊本市対策本部)</span>
              </div>
              <div className="flex justify-between">
                <span>夜間・救急安心センター:</span>
                <span className="font-mono text-white font-bold">#7119 または 119</span>
              </div>
              <div className="flex justify-between">
                <span>こころの健康相談:</span>
                <span className="font-mono text-white font-bold">096-362-8100</span>
              </div>
            </div>
          </div>

          {/* システム案内 */}
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700">
            <h4 className="text-white font-bold mb-2 text-sm text-blue-400">
              本システムについて
            </h4>
            <p className="text-slate-300 leading-relaxed">
              熊本地震における災害関連死防止の知見に基づき、行政・避難所スタッフ・避難者をつなぐ災害時車中泊支援プラットフォームです。
              車中泊避難者の健康状態や支援ニーズをリアルタイムに把握し、迅速な巡回と物資供給を支援します。
            </p>
          </div>
        </div>

        <div className="text-center pt-4 border-t border-slate-800 text-slate-500">
          © 2026 熊本市災害対策支援 車中泊避難者健康支援システム (Kumamoto Evacuation Care System)
        </div>
      </div>
    </footer>
  );
};

