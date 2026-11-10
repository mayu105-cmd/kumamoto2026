import React, { useState } from 'react';
import { LogOut, QrCode } from 'lucide-react';
import { AdminUser, FacilityId } from '../../types';
import { FACILITIES } from '../../utils/constants';
import { RegistrationQRModal } from '../admin/RegistrationQRModal';

interface NavbarProps {
  currentTab: 'evacuee_register' | 'evacuee_pass' | 'admin_dashboard' | 'admin_parking' | 'admin_list' | 'admin_data';
  onSelectTab: (tab: any) => void;
  adminUser: AdminUser | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenReissue: () => void;
  hasSavedPass: boolean;
  selectedFacility: FacilityId;
  onSelectFacility: (f: FacilityId) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  adminUser,
  onOpenLogin,
  onLogout,
  onOpenReissue,
  hasSavedPass,
  selectedFacility,
  onSelectFacility,
}) => {
  const isAdminView = currentTab.startsWith('admin_');
  const [isQROpen, setIsQROpen] = useState(false);

  return (
    <>
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm no-print">
      {/* 災害緊急ヘッダー帯 */}
      <div className="bg-blue-900 text-white text-xs py-1 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-900">
              熊本市災害対策支援
            </span>
            <span className="hidden sm:inline text-slate-200">
              熊本地震教訓対応型 車中泊避難者支援・健康リスク警戒システム
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-300">
            <span>指定避難施設: アクアドームくまもと / 熊本競輪場</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* ロゴ・システム名 */}
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">
                  車中泊避難支援
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  Kumamoto Care
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden md:block">
                健康悪化・エコノミークラス症候群防止 & 支援ニーズ把握
              </p>
            </div>
          </div>

          {/* ナビゲーション */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* 避難者用ボタン群 */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => onSelectTab('evacuee_register')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  currentTab === 'evacuee_register'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>避難者登録</span>
              </button>

              <button
                onClick={() => onSelectTab('evacuee_pass')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  currentTab === 'evacuee_pass'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>受付証(会員証)</span>
                {hasSavedPass && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-white animate-pulse" />
                )}
              </button>
            </div>

            {/* 受付証の再表示ボタン (避難者向け) */}
            <button
              onClick={onOpenReissue}
              className="hidden lg:flex items-center px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-blue-700 hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
              title="受付証を閉じてしまった場合に入力して再表示"
            >
              <span>受付証の再検索</span>
            </button>

            {/* 登録用QRコードボタン */}
            <button
              onClick={() => setIsQROpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-blue-700 hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
              title="避難所掲示用 登録QRコードを表示・印刷"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>登録QR</span>
            </button>

            {/* 区切り線 */}
            <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

            {/* 行政・避難所スタッフセクション */}
            {adminUser ? (
              <div className="flex items-center gap-2">
                <div className="hidden xl:flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-800">
                    {adminUser.name}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {adminUser.role === 'admin' ? '行政本部 管理者' : '避難所スタッフ'}
                  </span>
                </div>

                <div className="flex items-center gap-1 bg-slate-800 text-white p-1 rounded-xl">
                  <button
                    onClick={() => onSelectTab('admin_dashboard')}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      currentTab === 'admin_dashboard' ? 'bg-blue-600 text-white font-bold' : 'hover:text-blue-300'
                    }`}
                  >
                    ダッシュボード
                  </button>
                  <button
                    onClick={() => onSelectTab('admin_parking')}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      currentTab === 'admin_parking' ? 'bg-blue-600 text-white font-bold' : 'hover:text-blue-300'
                    }`}
                  >
                    駐車マップ
                  </button>
                  <button
                    onClick={() => onSelectTab('admin_list')}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      currentTab === 'admin_list' ? 'bg-blue-600 text-white font-bold' : 'hover:text-blue-300'
                    }`}
                  >
                    避難者台帳
                  </button>
                  <button
                    onClick={() => onSelectTab('admin_data')}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      currentTab === 'admin_data' ? 'bg-blue-600 text-white font-bold' : 'hover:text-blue-300'
                    }`}
                  >
                    入出力
                  </button>
                </div>

                <button
                  onClick={onLogout}
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="ログアウト"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 border border-slate-300 rounded-xl transition-all shadow-sm"
              >
                <span>行政・スタッフログイン</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 管理者ビューの時の施設選択タブバー */}
      {isAdminView && adminUser && (
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-600">管理対象施設:</span>
              <div className="flex rounded-lg overflow-hidden border border-slate-300 bg-white shadow-inner">
                <button
                  onClick={() => onSelectFacility('aquadome')}
                  className={`px-3 py-1 font-semibold transition-all ${
                    selectedFacility === 'aquadome'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  アクアドームくまもと (150台)
                </button>
                <button
                  onClick={() => onSelectFacility('keirin')}
                  className={`px-3 py-1 font-semibold transition-all ${
                    selectedFacility === 'keirin'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  熊本競輪場 (150台)
                </button>
              </div>
            </div>

            <div className="text-slate-500 hidden sm:block">
              {FACILITIES[selectedFacility].address} | TEL: {FACILITIES[selectedFacility].phone}
            </div>
          </div>
        </div>
      )}
    </header>

    {/* 登録用QRコードモーダル */}
    <RegistrationQRModal
      isOpen={isQROpen}
      onClose={() => setIsQROpen(false)}
      selectedFacility={selectedFacility}
    />
    </>
  );
};

