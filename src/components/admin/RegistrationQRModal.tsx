import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { X, Printer, Copy, Check } from 'lucide-react';
import { FacilityId } from '../../types';
import { FACILITIES } from '../../utils/constants';

interface RegistrationQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFacility?: FacilityId;
}

const FACILITY_OPTIONS: { id: FacilityId; label: string }[] = [
  { id: 'aquadome', label: 'アクアドームくまもと' },
  { id: 'keirin', label: '熊本競輪場' },
];

export const RegistrationQRModal: React.FC<RegistrationQRModalProps> = ({
  isOpen,
  onClose,
  selectedFacility = 'aquadome',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [facility, setFacility] = useState<FacilityId>(selectedFacility);
  const [copied, setCopied] = useState(false);

  // 現在のページのベースURL（登録フォームへのURL）
  const baseUrl = `${window.location.origin}${window.location.pathname}`;
  // 施設パラメータ付きURL
  const registrationUrl = `${baseUrl}?facility=${facility}`;

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    QRCode.toCanvas(
      canvasRef.current,
      registrationUrl,
      {
        width: 220,
        margin: 2,
        color: { dark: '#0f172a', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      },
      (err) => {
        if (err) console.error('QR生成エラー:', err);
      }
    );
  }, [isOpen, registrationUrl]);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(registrationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  const facilityInfo = FACILITIES[facility];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 no-print">
          <h2 className="text-base font-bold text-slate-900">避難者登録用 QRコード</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 施設選択 */}
        <div className="px-5 pt-4 no-print">
          <p className="text-xs font-semibold text-slate-600 mb-2">対象施設</p>
          <div className="flex rounded-lg overflow-hidden border border-slate-300 bg-slate-50 text-xs font-semibold">
            {FACILITY_OPTIONS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFacility(f.id)}
                className={`flex-1 py-2 transition-all ${
                  facility === f.id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* QRコード印刷エリア */}
        <div className="p-6 flex flex-col items-center gap-4 print-area">
          {/* 印刷時のヘッダー（画面では非表示） */}
          <div className="hidden print:block text-center mb-2">
            <p className="text-lg font-bold text-slate-900">熊本市 車中泊避難者支援システム</p>
            <p className="text-sm text-slate-700 mt-1">避難者登録はこちら</p>
          </div>

          {/* 施設名バッジ */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 text-center w-full">
            <p className="text-xs text-blue-600 font-semibold">{facilityInfo.name}</p>
            <p className="text-[11px] text-blue-500 mt-0.5">{facilityInfo.address}</p>
          </div>

          {/* QRコード */}
          <div className="bg-white border-2 border-slate-200 rounded-xl p-3 shadow-sm">
            <canvas ref={canvasRef} />
          </div>

          {/* 説明文 */}
          <div className="text-center space-y-1">
            <p className="text-xs font-bold text-slate-800">スマホでQRコードを読み取って</p>
            <p className="text-xs font-bold text-slate-800">避難者登録を行ってください</p>
            <p className="text-[11px] text-slate-500 mt-2">
              カメラアプリを起動してQRコードに向けるだけで登録フォームが開きます
            </p>
          </div>

          {/* URL表示（小さく） */}
          <div className="w-full bg-slate-50 rounded-lg px-3 py-2 text-center">
            <p className="text-[10px] text-slate-400 break-all">{registrationUrl}</p>
          </div>
        </div>

        {/* アクションボタン群 */}
        <div className="px-5 pb-5 flex gap-2 no-print">
          <button
            onClick={handleCopyUrl}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors text-slate-700"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-600" />
                <span className="text-green-600">コピー済み</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                URLをコピー
              </>
            )}
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            印刷する
          </button>
        </div>

        {/* 注意書き */}
        <div className="px-5 pb-5 no-print">
          <p className="text-[10px] text-slate-400 text-center leading-relaxed">
            印刷して避難所の入口や掲示板に貼ることで、<br />
            避難者がスマホから直接登録できます。
          </p>
        </div>
      </div>
    </div>
  );
};
