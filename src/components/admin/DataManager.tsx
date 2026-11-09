import React, { useRef, useState } from 'react';
import { EvacueeRecord } from '../../types';
import { exportToCsvWithBom, exportToJsonBackup, parseCsvRecords } from '../../utils/csv';
import { resetToInitialMockData } from '../../utils/storage';

interface DataManagerProps {
  records: EvacueeRecord[];
  onImportRecords: (newRecords: EvacueeRecord[]) => void;
  onResetData: () => void;
}

export const DataManager: React.FC<DataManagerProps> = ({
  records,
  onImportRecords,
  onResetData,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const jsonInputRef = useRef<HTMLInputElement | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // テンプレートCSVダウンロード
  const handleDownloadTemplate = () => {
    const templateHeader = [
      '避難者ID',
      '施設名',
      '区画番号',
      '代表者氏名',
      'フリガナ',
      '年代',
      '電話番号',
      '車両_車種',
      '車両_ナンバー',
      '車両_色',
      '車両_タイプ',
      '同乗者数(名)',
      '同乗者名簿',
      '体調状態',
      '症状一覧',
      '体調メモ',
      '特記事項・要配慮',
      '特記事項メモ',
      '支援物資ニーズ',
      '支援要望メモ',
    ].join(',');

    const sampleRow = [
      'EVAC-AQ-099',
      'アクアドームくまもと',
      '99',
      '熊本 見本',
      'クマモト ミホン',
      '40代',
      '090-0000-0000',
      'プリウス',
      '熊本 500 あ 99-99',
      '白',
      'sedan',
      '2',
      '熊本 花子(妻,40代)',
      '良好',
      '',
      '',
      '',
      '',
      'water_food',
      '水希望',
    ].map(s => `"${s}"`).join(',');

    const content = '\uFEFF' + templateHeader + '\r\n' + sampleRow;
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '車中泊避難者台帳_取込テンプレート.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  // CSVインポート
  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseCsvRecords(text);
        if (parsed.length === 0) {
          setStatusMessage({ text: '有効なデータが見つかりませんでした。', type: 'error' });
          return;
        }

        // 既存データとマージまたは追加
        const converted: EvacueeRecord[] = parsed.map((p, idx) => ({
          id: p.id || `EVAC-IMP-${Date.now()}-${idx}`,
          facilityId: p.facilityId || 'aquadome',
          slotNumber: p.slotNumber || (idx + 1),
          name: p.name || '不明',
          nameKana: p.nameKana,
          ageGroup: p.ageGroup || '40代',
          phone: p.phone || '',
          vehicle: p.vehicle || { model: '普通車', numberPlate: '', color: '白', type: 'sedan' },
          passengerCount: p.passengerCount || 1,
          passengers: p.passengers || [],
          healthStatus: p.healthStatus || 'good',
          healthSymptoms: p.healthSymptoms || [],
          healthNote: p.healthNote,
          lastHealthCheckAt: new Date().toISOString(),
          specialNeeds: p.specialNeeds || [],
          specialNeedsNote: p.specialNeedsNote,
          aidNeeds: p.aidNeeds || ['water_food'],
          aidNeedsNote: p.aidNeedsNote,
          aidDistributions: [],
          entryTime: new Date().toISOString(),
          patrolStatus: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));

        onImportRecords([...records, ...converted]);
        setStatusMessage({ text: `${converted.length}件の避難者データをインポートしました。`, type: 'success' });
      } catch (err) {
        console.error(err);
        setStatusMessage({ text: 'CSVの読み込みに失敗しました。書式をご確認ください。', type: 'error' });
      }
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  };

  // JSONインポート
  const handleJsonFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed.length > 0) {
          onImportRecords(parsed);
          setStatusMessage({ text: `JSONバックアップから ${parsed.length} 件のデータを完全復元しました。`, type: 'success' });
        } else {
          setStatusMessage({ text: '有効な避難者データ配列が見つかりませんでした。', type: 'error' });
        }
      } catch (err) {
        setStatusMessage({ text: 'JSONの解析に失敗しました。', type: 'error' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // デモデータリセット
  const handleReset = () => {
    if (window.confirm('現在の避難者データをリセットし、初期デモデータ（約105台分のリアル避難データ）を再投入しますか？')) {
      onResetData();
      setStatusMessage({ text: '初期デモデータにリセットしました。', type: 'success' });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h2 className="text-xl font-black text-slate-900">
          <span>データ管理・インポート・エクスポート</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          UTF-8 BOM付きCSVによる自治体・関係機関連携、JSONバックアップ・リストア、外部台帳の一括取込が可能です。
        </p>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-2xl border text-xs font-bold ${statusMessage.type === 'success'
            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
            : 'bg-red-50 border-red-300 text-red-800'
          }`}>
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* CSV エクスポート & インポート */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CSV エクスポート */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-emerald-700 font-bold text-sm mb-2">
              <span>CSV出力 (Excel対応 BOM付き)</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Microsoft Excelで文字化けせずにそのまま開けるUTF-8 BOM付きCSVを出力します。健康リスク判定結果、同乗者名簿、物資ニーズを含みます。
            </p>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => exportToCsvWithBom(records)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center"
            >
              <span>現在の台帳をCSVエクスポート ({records.length}件)</span>
            </button>
            <button
              onClick={handleDownloadTemplate}
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium text-xs rounded-xl border border-slate-200 transition-colors"
            >
              CSV取込用ひな形（テンプレート）をダウンロード
            </button>
          </div>
        </div>

        {/* CSV インポート */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-blue-700 font-bold text-sm mb-2">
              <span>CSV一括インポート</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              他の避難所で作成されたCSV名簿や手書き受付台帳のデータを取り込み、システムに一括登録します。
            </p>
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleCsvFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center"
            >
              <span>CSVファイルを選択して取り込む</span>
            </button>
          </div>
        </div>
      </div>

      {/* JSON バックアップ & リストア */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* JSON エクスポート */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-indigo-700 font-bold text-sm mb-2">
              <span>JSON 完全バックアップ</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              すべての巡回履歴、物資配布ログ、同乗者詳細を完全な構造でバックアップ保存します。
            </p>
          </div>

          <button
            onClick={() => exportToJsonBackup(records)}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center"
          >
            <span>完全バックアップJSONを保存</span>
          </button>
        </div>

        {/* JSON リストア */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-purple-700 font-bold text-sm mb-2">
              <span>JSON からの完全復元</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              保存したJSONバックアップファイルから避難者データを完全に復元・置き換えます。
            </p>
          </div>

          <div>
            <input
              ref={jsonInputRef}
              type="file"
              accept=".json"
              onChange={handleJsonFileChange}
              className="hidden"
            />
            <button
              onClick={() => jsonInputRef.current?.click()}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center"
            >
              <span>バックアップJSONから復元する</span>
            </button>
          </div>
        </div>
      </div>

      {/* デモデータ初期化セクション */}
      <div className="bg-amber-50/60 rounded-2xl p-6 border border-amber-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-amber-950">
            <span>防災訓練・審査プレゼン用 初期デモデータへのリセット</span>
          </h3>
          <p className="text-xs text-amber-800/80 mt-1">
            アクアドーム熊本・熊本競輪場のリアルな避難者サンプル（エコノミークラス警戒者、妊婦、乳幼児、高齢者、各種物資ニーズ）に復元します。
          </p>
        </div>

        <button
          onClick={handleReset}
          className="px-4 py-2.5 bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-bold transition-all shadow-sm shrink-0"
        >
          デモデータを再読み込み
        </button>
      </div>
    </div>
  );
};

