import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useInterstitialAd } from '../hooks/useInterstitialAd';
import BannerAd from './BannerAd';

type UnitCategory = 'length' | 'weight' | 'temperature' | 'area' | 'volume' | 'speed' | 'data';

interface UnitInfo {
  key: string;
  name: string;
  symbol: string;
  toBase: (value: number) => number;
  fromBase: (value: number) => number;
}

interface ConversionRecord {
  id: string;
  category: UnitCategory;
  fromUnit: string;
  toUnit: string;
  fromValue: string;
  toValue: string;
  timestamp: number;
}

interface QuickPreset {
  fromUnit: string;
  toUnit: string;
  value: string;
  label: string;
}

const lengthUnits: UnitInfo[] = [
  { key: 'mm', name: '밀리미터', symbol: 'mm', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
  { key: 'cm', name: '센티미터', symbol: 'cm', toBase: (v) => v / 100, fromBase: (v) => v * 100 },
  { key: 'm', name: '미터', symbol: 'm', toBase: (v) => v, fromBase: (v) => v },
  { key: 'km', name: '킬로미터', symbol: 'km', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
  { key: 'in', name: '인치', symbol: 'in', toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
  { key: 'ft', name: '피트', symbol: 'ft', toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
  { key: 'yd', name: '야드', symbol: 'yd', toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
  { key: 'mile', name: '마일', symbol: 'mi', toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
  { key: 'ja', name: '자', symbol: '자', toBase: (v) => v * 0.30303, fromBase: (v) => v / 0.30303 },
  { key: 'chi', name: '치', symbol: '치', toBase: (v) => v * 0.030303, fromBase: (v) => v / 0.030303 },
];

const weightUnits: UnitInfo[] = [
  { key: 'mg', name: '밀리그램', symbol: 'mg', toBase: (v) => v / 1000000, fromBase: (v) => v * 1000000 },
  { key: 'g', name: '그램', symbol: 'g', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
  { key: 'kg', name: '킬로그램', symbol: 'kg', toBase: (v) => v, fromBase: (v) => v },
  { key: 't', name: '톤', symbol: 't', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
  { key: 'lb', name: '파운드', symbol: 'lb', toBase: (v) => v * 0.45359237, fromBase: (v) => v / 0.45359237 },
  { key: 'oz', name: '온스', symbol: 'oz', toBase: (v) => v * 0.0283495, fromBase: (v) => v / 0.0283495 },
  { key: 'geun', name: '근', symbol: '근', toBase: (v) => v * 0.6, fromBase: (v) => v / 0.6 },
  { key: 'don', name: '돈', symbol: '돈', toBase: (v) => v * 0.00375, fromBase: (v) => v / 0.00375 },
];

const temperatureUnits: UnitInfo[] = [
  { key: 'c', name: '섭씨', symbol: '\u00B0C', toBase: (v) => v, fromBase: (v) => v },
  { key: 'f', name: '화씨', symbol: '\u00B0F', toBase: (v) => (v - 32) * 5 / 9, fromBase: (v) => v * 9 / 5 + 32 },
  { key: 'k', name: '켈빈', symbol: 'K', toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
];

const areaUnits: UnitInfo[] = [
  { key: 'cm2', name: '제곱센티미터', symbol: 'cm\u00B2', toBase: (v) => v / 10000, fromBase: (v) => v * 10000 },
  { key: 'm2', name: '제곱미터', symbol: 'm\u00B2', toBase: (v) => v, fromBase: (v) => v },
  { key: 'km2', name: '제곱킬로미터', symbol: 'km\u00B2', toBase: (v) => v * 1000000, fromBase: (v) => v / 1000000 },
  { key: 'pyeong', name: '평', symbol: '평', toBase: (v) => v * 3.305785, fromBase: (v) => v / 3.305785 },
  { key: 'acre', name: '에이커', symbol: 'acre', toBase: (v) => v * 4046.8564, fromBase: (v) => v / 4046.8564 },
  { key: 'ha', name: '헥타르', symbol: 'ha', toBase: (v) => v * 10000, fromBase: (v) => v / 10000 },
];

const volumeUnits: UnitInfo[] = [
  { key: 'ml', name: '밀리리터', symbol: 'mL', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
  { key: 'l', name: '리터', symbol: 'L', toBase: (v) => v, fromBase: (v) => v },
  { key: 'cc', name: '시시', symbol: 'cc', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
  { key: 'gal', name: '갤런(US)', symbol: 'gal', toBase: (v) => v * 3.78541, fromBase: (v) => v / 3.78541 },
  { key: 'm3', name: '세제곱미터', symbol: 'm\u00B3', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
];

const speedUnits: UnitInfo[] = [
  { key: 'mps', name: '미터/초', symbol: 'm/s', toBase: (v) => v, fromBase: (v) => v },
  { key: 'kmh', name: '킬로미터/시', symbol: 'km/h', toBase: (v) => v / 3.6, fromBase: (v) => v * 3.6 },
  { key: 'mph', name: '마일/시', symbol: 'mph', toBase: (v) => v * 0.44704, fromBase: (v) => v / 0.44704 },
  { key: 'knot', name: '노트', symbol: 'kn', toBase: (v) => v * 0.514444, fromBase: (v) => v / 0.514444 },
];

const dataUnits: UnitInfo[] = [
  { key: 'b', name: '바이트', symbol: 'B', toBase: (v) => v, fromBase: (v) => v },
  { key: 'kb', name: '킬로바이트', symbol: 'KB', toBase: (v) => v * 1024, fromBase: (v) => v / 1024 },
  { key: 'mb', name: '메가바이트', symbol: 'MB', toBase: (v) => v * 1024 * 1024, fromBase: (v) => v / (1024 * 1024) },
  { key: 'gb', name: '기가바이트', symbol: 'GB', toBase: (v) => v * 1024 * 1024 * 1024, fromBase: (v) => v / (1024 * 1024 * 1024) },
  { key: 'tb', name: '테라바이트', symbol: 'TB', toBase: (v) => v * 1024 * 1024 * 1024 * 1024, fromBase: (v) => v / (1024 * 1024 * 1024 * 1024) },
];

const categoryInfo: Record<UnitCategory, { name: string; icon: string; units: UnitInfo[] }> = {
  length: { name: '길이', icon: '\uD83D\uDCCF', units: lengthUnits },
  weight: { name: '무게', icon: '\u2696\uFE0F', units: weightUnits },
  temperature: { name: '온도', icon: '\uD83C\uDF21\uFE0F', units: temperatureUnits },
  area: { name: '면적', icon: '\uD83D\uDCD0', units: areaUnits },
  volume: { name: '부피', icon: '\uD83E\uDDEA', units: volumeUnits },
  speed: { name: '속도', icon: '\uD83D\uDE80', units: speedUnits },
  data: { name: '데이터', icon: '\uD83D\uDCBE', units: dataUnits },
};

const quickPresets: Record<UnitCategory, QuickPreset[]> = {
  length: [
    { fromUnit: 'in', toUnit: 'cm', value: '1', label: '1인치 \u2192 cm' },
    { fromUnit: 'ft', toUnit: 'm', value: '1', label: '1피트 \u2192 m' },
    { fromUnit: 'mile', toUnit: 'km', value: '1', label: '1마일 \u2192 km' },
  ],
  weight: [
    { fromUnit: 'lb', toUnit: 'kg', value: '1', label: '1파운드 \u2192 kg' },
    { fromUnit: 'oz', toUnit: 'g', value: '1', label: '1온스 \u2192 g' },
    { fromUnit: 'geun', toUnit: 'kg', value: '1', label: '1근 \u2192 kg' },
  ],
  temperature: [
    { fromUnit: 'f', toUnit: 'c', value: '98.6', label: '체온(\u00B0F) \u2192 \u00B0C' },
    { fromUnit: 'c', toUnit: 'f', value: '0', label: '빙점 \u2192 \u00B0F' },
  ],
  area: [
    { fromUnit: 'pyeong', toUnit: 'm2', value: '1', label: '1평 \u2192 m\u00B2' },
    { fromUnit: 'm2', toUnit: 'pyeong', value: '33', label: '33m\u00B2 \u2192 평' },
  ],
  volume: [
    { fromUnit: 'gal', toUnit: 'l', value: '1', label: '1갤런 \u2192 L' },
    { fromUnit: 'l', toUnit: 'ml', value: '1', label: '1리터 \u2192 mL' },
  ],
  speed: [
    { fromUnit: 'kmh', toUnit: 'mph', value: '100', label: '100km/h \u2192 mph' },
    { fromUnit: 'mps', toUnit: 'kmh', value: '1', label: '1m/s \u2192 km/h' },
  ],
  data: [
    { fromUnit: 'gb', toUnit: 'mb', value: '1', label: '1GB \u2192 MB' },
    { fromUnit: 'mb', toUnit: 'kb', value: '1', label: '1MB \u2192 KB' },
  ],
};

const friendlyMessages = [
  '변환 완료!',
  '정확하게 계산했어요',
  '이제 헷갈리지 않겠죠?',
  '유용하게 쓰세요!',
];

const PRIMARY_COLOR = '#5C6BC0';
const AD_ID = 'ait.v2.live.2be710cefc03430e';
const BANNER_AD_ID = 'ait.v2.live.6ffed085ec6b47cd';

export default function UnitConverter() {
  const [category, setCategory] = useState<UnitCategory>('length');
  const [fromUnit, setFromUnit] = useState<UnitInfo>(categoryInfo.length.units[2]);
  const [toUnit, setToUnit] = useState<UnitInfo>(categoryInfo.length.units[3]);
  const [inputValue, setInputValue] = useState('1');
  const [result, setResult] = useState<string>('');
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [recentRecords, setRecentRecords] = useState<ConversionRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [copied, setCopied] = useState(false);
  const [friendlyMsg, setFriendlyMsg] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const { showAd } = useInterstitialAd(AD_ID);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2000);
  };

  useEffect(() => {
    const units = categoryInfo[category].units;
    setFromUnit(units[0]);
    setToUnit(units.length > 1 ? units[1] : units[0]);
  }, [category]);

  useEffect(() => {
    const value = parseFloat(inputValue);
    if (isNaN(value)) {
      setResult('');
      setFriendlyMsg('');
      return;
    }
    const baseValue = fromUnit.toBase(value);
    const converted = toUnit.fromBase(baseValue);
    setResult(converted.toLocaleString('ko-KR', { maximumFractionDigits: 6 }));

    const randomMsg = friendlyMessages[Math.floor(Math.random() * friendlyMessages.length)];
    setFriendlyMsg(randomMsg);
  }, [inputValue, fromUnit, toUnit]);

  const swapUnits = () => {
    const temp = fromUnit;
    setFromUnit(toUnit);
    setToUnit(temp);
  };

  const copyResult = () => {
    if (result) {
      const textToCopy = `${inputValue} ${fromUnit.symbol} = ${result} ${toUnit.symbol}`;
      navigator.clipboard.writeText(textToCopy).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const applyPreset = (preset: QuickPreset) => {
    const units = categoryInfo[category].units;
    const from = units.find(u => u.key === preset.fromUnit);
    const to = units.find(u => u.key === preset.toUnit);
    if (from && to) {
      setFromUnit(from);
      setToUnit(to);
      setInputValue(preset.value);
    }
  };

  const handleSaveRecord = useCallback(() => {
    if (!inputValue || !result) {
      showToast('변환할 값을 먼저 입력해주세요');
      return;
    }

    showAd({
      onDismiss: () => {
        const newRecord: ConversionRecord = {
          id: Date.now().toString(),
          category,
          fromUnit: fromUnit.key,
          toUnit: toUnit.key,
          fromValue: inputValue,
          toValue: result,
          timestamp: Date.now(),
        };

        setRecentRecords(prev => [newRecord, ...prev].slice(0, 10));
        showToast('변환 기록이 저장되었습니다');
      },
    });
  }, [inputValue, result, category, fromUnit, toUnit, showAd]);

  const applyRecord = (record: ConversionRecord) => {
    setCategory(record.category);
    const units = categoryInfo[record.category].units;
    const from = units.find(u => u.key === record.fromUnit);
    const to = units.find(u => u.key === record.toUnit);
    if (from && to) {
      setFromUnit(from);
      setToUnit(to);
      setInputValue(record.fromValue);
    }
    setShowHistory(false);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FA] relative">
      {/* 카테고리 탭 */}
      <div className="bg-white border-b border-[#E9ECEF] py-2">
        <div className="flex overflow-x-auto px-3 gap-2 scrollbar-hide">
          {(Object.keys(categoryInfo) as UnitCategory[]).map((cat) => (
            <button
              key={cat}
              className={`flex flex-col items-center justify-center px-4 py-2.5 rounded-[20px] min-w-[70px] min-h-[56px] shrink-0 transition-colors ${
                category === cat
                  ? 'bg-primary text-white'
                  : 'bg-[#F1F3F5] text-[#495057]'
              }`}
              onClick={() => setCategory(cat)}
            >
              <span className="text-xl mb-1">{categoryInfo[cat].icon}</span>
              <span className={`text-xs ${category === cat ? 'font-bold' : 'font-medium'}`}>
                {categoryInfo[cat].name}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* 퀵 프리셋 */}
        <div className="mb-3">
          <p className="text-[13px] text-[#868E96] mb-2 ml-1">자주 쓰는 변환</p>
          <div className="flex overflow-x-auto gap-2 scrollbar-hide">
            {quickPresets[category].map((preset, idx) => (
              <button
                key={idx}
                className="bg-[#E8EAF6] px-3.5 py-2 rounded-2xl shrink-0 active:opacity-70 transition-opacity"
                onClick={() => applyPreset(preset)}
              >
                <span className="text-[13px] text-primary font-medium">{preset.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 메인 변환 카드 */}
        <div className="bg-white rounded-[20px] p-5 mb-3 shadow-sm">
          <p className="text-[13px] text-[#868E96] mb-2">변환할 값</p>
          <button
            className="w-full bg-[#F8F9FA] rounded-xl p-3.5 mb-3 flex justify-between items-center active:opacity-70 transition-opacity"
            onClick={() => setShowFromPicker(true)}
          >
            <span className="text-base font-semibold text-[#212529]">{fromUnit.name}</span>
            <span className="text-sm text-[#868E96]">{fromUnit.symbol}</span>
          </button>
          <input
            type="number"
            className="w-full bg-[#F8F9FA] rounded-xl px-4 py-4 text-xl mb-4 text-[#212529] outline-none border border-transparent focus:border-primary transition-colors"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="값 입력"
          />

          <div className="flex justify-center my-2">
            <button
              className="w-12 h-12 rounded-full flex items-center justify-center text-white text-[22px] active:opacity-80 transition-opacity"
              style={{ backgroundColor: PRIMARY_COLOR, boxShadow: `0 4px 8px ${PRIMARY_COLOR}4D` }}
              onClick={swapUnits}
            >
              <i className="ri-arrow-up-down-line text-xl"></i>
            </button>
          </div>

          <p className="text-[13px] text-[#868E96] mb-2 mt-2">변환 결과</p>
          <button
            className="w-full bg-[#F8F9FA] rounded-xl p-3.5 mb-3 flex justify-between items-center active:opacity-70 transition-opacity"
            onClick={() => setShowToPicker(true)}
          >
            <span className="text-base font-semibold text-[#212529]">{toUnit.name}</span>
            <span className="text-sm text-[#868E96]">{toUnit.symbol}</span>
          </button>
          <div className="bg-[#F8F9FA] rounded-xl p-4">
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold text-primary flex-1 break-all">{result || '-'}</span>
              <span className="text-base text-[#868E96] ml-2 shrink-0">{toUnit.symbol}</span>
            </div>
            {result && (
              <button
                className="mt-3 bg-[#E8EAF6] px-4 py-2 rounded-lg active:opacity-70 transition-opacity"
                onClick={copyResult}
              >
                <span className="text-[13px] text-primary font-medium">
                  {copied ? '\u2713 복사됨' : '\uD83D\uDCCB 복사'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* 변환 공식 + 친근한 메시지 */}
        {inputValue && result && (
          <div className="bg-[#E8EAF6] rounded-xl p-4 mb-3 text-center">
            <p className="text-base font-semibold text-primary">
              {inputValue} {fromUnit.symbol} = {result} {toUnit.symbol}
            </p>
            {friendlyMsg && (
              <p className="text-[13px] text-[#7986CB] mt-1.5">{friendlyMsg}</p>
            )}
          </div>
        )}

        {/* 배너 광고 */}
        <div className="mb-3 rounded-2xl overflow-hidden">
          <BannerAd adGroupId={BANNER_AD_ID} />
        </div>

        {/* 기록 저장 버튼 (광고 연동) */}
        <button
          className={`w-full bg-white rounded-2xl p-4 mb-3 border border-[#E9ECEF] text-center active:opacity-70 transition-opacity ${
            (!inputValue || !result) ? 'opacity-50' : ''
          }`}
          onClick={handleSaveRecord}
          disabled={!inputValue || !result}
        >
          <div className="flex items-center justify-center mb-1">
            <span className="text-[15px] font-semibold text-[#495057]">
              <i className="ri-file-text-line mr-1"></i>
              이 변환 기록 저장하기
            </span>
            <span className="bg-[#FFF3CD] rounded px-1.5 py-0.5 ml-2 text-[10px] font-bold text-[#856404]">AD</span>
          </div>
          <p className="text-xs text-[#ADB5BD]">광고 시청 후 기록이 저장됩니다</p>
        </button>

        {/* 최근 기록 섹션 */}
        {recentRecords.length > 0 && (
          <div className="bg-white rounded-2xl overflow-hidden mb-3">
            <button
              className="w-full flex justify-between items-center p-4 border-b border-[#F1F3F5] active:opacity-70 transition-opacity"
              onClick={() => setShowHistory(!showHistory)}
            >
              <span className="text-sm font-semibold text-[#495057]">
                <i className="ri-clipboard-line mr-1"></i>
                최근 변환 기록 ({recentRecords.length})
              </span>
              <span className="text-xs text-[#868E96]">{showHistory ? '\u25B2' : '\u25BC'}</span>
            </button>

            {showHistory && (
              <div className="px-2">
                {recentRecords.map((record) => (
                  <button
                    key={record.id}
                    className="w-full flex justify-between items-center p-3 border-b border-[#F8F9FA] active:opacity-70 transition-opacity text-left"
                    onClick={() => applyRecord(record)}
                  >
                    <div className="flex items-center flex-1">
                      <span className="text-xl mr-3">{categoryInfo[record.category].icon}</span>
                      <div>
                        <p className="text-sm font-medium text-[#212529]">
                          {record.fromValue} {categoryInfo[record.category].units.find(u => u.key === record.fromUnit)?.symbol} &rarr; {record.toValue} {categoryInfo[record.category].units.find(u => u.key === record.toUnit)?.symbol}
                        </p>
                        <p className="text-xs text-[#ADB5BD] mt-0.5">{formatTime(record.timestamp)}</p>
                      </div>
                    </div>
                    <span className="text-[13px] text-primary font-semibold shrink-0 ml-2">적용</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="h-10" />
      </div>

      {/* 단위 선택 피커 - From */}
      {showFromPicker && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowFromPicker(false)} />
          <div className="relative bg-white rounded-t-3xl max-h-[60%] pb-8 flex flex-col">
            <div className="flex justify-between items-center py-5 px-5 border-b border-[#E9ECEF]">
              <span className="text-lg font-bold text-[#212529]">단위 선택</span>
              <button className="text-xl text-[#868E96] p-1" onClick={() => setShowFromPicker(false)}>
                <i className="ri-close-line"></i>
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              {categoryInfo[category].units.map((unit) => (
                <button
                  key={unit.key}
                  className={`w-full flex justify-between items-center py-4 px-5 border-b border-[#F1F3F5] active:opacity-70 transition-opacity ${
                    fromUnit.key === unit.key ? 'bg-[#E8EAF6]' : ''
                  }`}
                  onClick={() => { setFromUnit(unit); setShowFromPicker(false); }}
                >
                  <span className={`text-base ${fromUnit.key === unit.key ? 'font-bold text-primary' : 'font-medium text-[#212529]'}`}>
                    {unit.name}
                  </span>
                  <span className="text-sm text-[#868E96]">{unit.symbol}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 단위 선택 피커 - To */}
      {showToPicker && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowToPicker(false)} />
          <div className="relative bg-white rounded-t-3xl max-h-[60%] pb-8 flex flex-col">
            <div className="flex justify-between items-center py-5 px-5 border-b border-[#E9ECEF]">
              <span className="text-lg font-bold text-[#212529]">단위 선택</span>
              <button className="text-xl text-[#868E96] p-1" onClick={() => setShowToPicker(false)}>
                <i className="ri-close-line"></i>
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              {categoryInfo[category].units.map((unit) => (
                <button
                  key={unit.key}
                  className={`w-full flex justify-between items-center py-4 px-5 border-b border-[#F1F3F5] active:opacity-70 transition-opacity ${
                    toUnit.key === unit.key ? 'bg-[#E8EAF6]' : ''
                  }`}
                  onClick={() => { setToUnit(unit); setShowToPicker(false); }}
                >
                  <span className={`text-base ${toUnit.key === unit.key ? 'font-bold text-primary' : 'font-medium text-[#212529]'}`}>
                    {unit.name}
                  </span>
                  <span className="text-sm text-[#868E96]">{unit.symbol}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[100] bg-[#333] text-white text-sm px-5 py-3 rounded-xl shadow-lg animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  );
}
