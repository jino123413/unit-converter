import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, TouchableOpacity, ScrollView, StyleSheet, TextInput, Alert, Clipboard } from 'react-native';
import { Text } from '@toss/tds-react-native';
import { GoogleAdMob } from '@apps-in-toss/framework';

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
  // 한국 전통 단위
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
  { key: 'c', name: '섭씨', symbol: '°C', toBase: (v) => v, fromBase: (v) => v },
  { key: 'f', name: '화씨', symbol: '°F', toBase: (v) => (v - 32) * 5 / 9, fromBase: (v) => v * 9 / 5 + 32 },
  { key: 'k', name: '켈빈', symbol: 'K', toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
];

const areaUnits: UnitInfo[] = [
  { key: 'cm2', name: '제곱센티미터', symbol: 'cm²', toBase: (v) => v / 10000, fromBase: (v) => v * 10000 },
  { key: 'm2', name: '제곱미터', symbol: 'm²', toBase: (v) => v, fromBase: (v) => v },
  { key: 'km2', name: '제곱킬로미터', symbol: 'km²', toBase: (v) => v * 1000000, fromBase: (v) => v / 1000000 },
  { key: 'pyeong', name: '평', symbol: '평', toBase: (v) => v * 3.305785, fromBase: (v) => v / 3.305785 },
  { key: 'acre', name: '에이커', symbol: 'acre', toBase: (v) => v * 4046.8564, fromBase: (v) => v / 4046.8564 },
  { key: 'ha', name: '헥타르', symbol: 'ha', toBase: (v) => v * 10000, fromBase: (v) => v / 10000 },
];

const volumeUnits: UnitInfo[] = [
  { key: 'ml', name: '밀리리터', symbol: 'mL', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
  { key: 'l', name: '리터', symbol: 'L', toBase: (v) => v, fromBase: (v) => v },
  { key: 'cc', name: '시시', symbol: 'cc', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
  { key: 'gal', name: '갤런(US)', symbol: 'gal', toBase: (v) => v * 3.78541, fromBase: (v) => v / 3.78541 },
  { key: 'm3', name: '세제곱미터', symbol: 'm³', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
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
  length: { name: '길이', icon: '📏', units: lengthUnits },
  weight: { name: '무게', icon: '⚖️', units: weightUnits },
  temperature: { name: '온도', icon: '🌡️', units: temperatureUnits },
  area: { name: '면적', icon: '📐', units: areaUnits },
  volume: { name: '부피', icon: '🧪', units: volumeUnits },
  speed: { name: '속도', icon: '🚀', units: speedUnits },
  data: { name: '데이터', icon: '💾', units: dataUnits },
};

// 차별화 기능: 자주 쓰는 변환 퀵 프리셋
const quickPresets: Record<UnitCategory, QuickPreset[]> = {
  length: [
    { fromUnit: 'in', toUnit: 'cm', value: '1', label: '1인치 → cm' },
    { fromUnit: 'ft', toUnit: 'm', value: '1', label: '1피트 → m' },
    { fromUnit: 'mile', toUnit: 'km', value: '1', label: '1마일 → km' },
  ],
  weight: [
    { fromUnit: 'lb', toUnit: 'kg', value: '1', label: '1파운드 → kg' },
    { fromUnit: 'oz', toUnit: 'g', value: '1', label: '1온스 → g' },
    { fromUnit: 'geun', toUnit: 'kg', value: '1', label: '1근 → kg' },
  ],
  temperature: [
    { fromUnit: 'f', toUnit: 'c', value: '98.6', label: '체온(°F) → °C' },
    { fromUnit: 'c', toUnit: 'f', value: '0', label: '빙점 → °F' },
  ],
  area: [
    { fromUnit: 'pyeong', toUnit: 'm2', value: '1', label: '1평 → m²' },
    { fromUnit: 'm2', toUnit: 'pyeong', value: '33', label: '33m² → 평' },
  ],
  volume: [
    { fromUnit: 'gal', toUnit: 'l', value: '1', label: '1갤런 → L' },
    { fromUnit: 'l', toUnit: 'ml', value: '1', label: '1리터 → mL' },
  ],
  speed: [
    { fromUnit: 'kmh', toUnit: 'mph', value: '100', label: '100km/h → mph' },
    { fromUnit: 'mps', toUnit: 'kmh', value: '1', label: '1m/s → km/h' },
  ],
  data: [
    { fromUnit: 'gb', toUnit: 'mb', value: '1', label: '1GB → MB' },
    { fromUnit: 'mb', toUnit: 'kb', value: '1', label: '1MB → KB' },
  ],
};

// 친근한 메시지 (리텐션)
const friendlyMessages = [
  '변환 완료!',
  '정확하게 계산했어요',
  '이제 헷갈리지 않겠죠?',
  '유용하게 쓰세요!',
];

const PRIMARY_COLOR = '#5C6BC0';
const AD_ID = 'ait.v2.live.2be710cefc03430e';

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

  const adLoadedRef = useRef(false);
  const adAvailableRef = useRef(false);

  useEffect(() => {
    loadAd();
  }, []);

  const loadAd = () => {
    try {
      if (!GoogleAdMob || typeof GoogleAdMob.loadAppsInTossAdMob !== 'function') {
        adAvailableRef.current = false;
        return;
      }
      adAvailableRef.current = true;

      GoogleAdMob.loadAppsInTossAdMob({
        options: { adGroupId: AD_ID },
        onEvent: (event: any) => {
          if (event.type === 'loaded') {
            adLoadedRef.current = true;
          }
        },
        onError: () => {
          adLoadedRef.current = false;
        },
      });
    } catch {
      adAvailableRef.current = false;
    }
  };

  const showAd = (callback: () => void) => {
    if (!adAvailableRef.current || !adLoadedRef.current) {
      callback();
      return;
    }
    try {
      GoogleAdMob.showAppsInTossAdMob({
        options: { adGroupId: AD_ID },
        onEvent: (event: any) => {
          if (event.type === 'dismissed') {
            callback();
            adLoadedRef.current = false;
            loadAd();
          }
        },
        onError: () => {
          callback();
          adLoadedRef.current = false;
          loadAd();
        },
      });
    } catch {
      callback();
    }
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

    // 친근한 메시지 표시
    const randomMsg = friendlyMessages[Math.floor(Math.random() * friendlyMessages.length)];
    setFriendlyMsg(randomMsg);
  }, [inputValue, fromUnit, toUnit]);

  const swapUnits = () => {
    const temp = fromUnit;
    setFromUnit(toUnit);
    setToUnit(temp);
  };

  // 차별화 기능: 결과 복사
  const copyResult = () => {
    if (result) {
      const textToCopy = `${inputValue} ${fromUnit.symbol} = ${result} ${toUnit.symbol}`;
      Clipboard.setString(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 차별화 기능: 퀵 프리셋 적용
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
      Alert.alert('알림', '변환할 값을 먼저 입력해주세요.');
      return;
    }

    showAd(() => {
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
      Alert.alert('저장 완료', '변환 기록이 저장되었습니다.');
    });
  }, [inputValue, result, category, fromUnit, toUnit]);

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
    <View style={styles.container}>
      {/* 카테고리 탭 - 크기 수정 */}
      <View style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScrollContent}>
          {(Object.keys(categoryInfo) as UnitCategory[]).map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryTab, category === cat && styles.categoryTabActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={styles.categoryIcon}>{categoryInfo[cat].icon}</Text>
              <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>
                {categoryInfo[cat].name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.content}>
        {/* 퀵 프리셋 (차별화 기능) */}
        <View style={styles.presetSection}>
          <Text style={styles.presetTitle}>자주 쓰는 변환</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {quickPresets[category].map((preset, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.presetChip}
                onPress={() => applyPreset(preset)}
              >
                <Text style={styles.presetText}>{preset.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 메인 변환 카드 */}
        <View style={styles.card}>
          <Text style={styles.label}>변환할 값</Text>
          <TouchableOpacity style={styles.unitSelector} onPress={() => setShowFromPicker(true)}>
            <Text style={styles.unitName}>{fromUnit.name}</Text>
            <Text style={styles.unitSymbol}>{fromUnit.symbol}</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            value={inputValue}
            onChangeText={setInputValue}
            keyboardType="numeric"
            placeholder="값 입력"
            placeholderTextColor="#ADB5BD"
          />

          <TouchableOpacity style={styles.swapButton} onPress={swapUnits}>
            <Text style={styles.swapIcon}>⇅</Text>
          </TouchableOpacity>

          <Text style={styles.label}>변환 결과</Text>
          <TouchableOpacity style={styles.unitSelector} onPress={() => setShowToPicker(true)}>
            <Text style={styles.unitName}>{toUnit.name}</Text>
            <Text style={styles.unitSymbol}>{toUnit.symbol}</Text>
          </TouchableOpacity>
          <View style={styles.resultBox}>
            <View style={styles.resultContent}>
              <Text style={styles.resultText}>{result || '-'}</Text>
              <Text style={styles.resultUnit}>{toUnit.symbol}</Text>
            </View>
            {/* 복사 버튼 (차별화 기능) */}
            {result && (
              <TouchableOpacity style={styles.copyButton} onPress={copyResult}>
                <Text style={styles.copyButtonText}>{copied ? '✓ 복사됨' : '📋 복사'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 변환 공식 + 친근한 메시지 */}
        {inputValue && result && (
          <View style={styles.formulaCard}>
            <Text style={styles.formulaText}>
              {inputValue} {fromUnit.symbol} = {result} {toUnit.symbol}
            </Text>
            {friendlyMsg && (
              <Text style={styles.friendlyMsg}>{friendlyMsg}</Text>
            )}
          </View>
        )}

        {/* 기록 저장 버튼 (광고 연동) */}
        <TouchableOpacity
          style={[styles.saveButton, (!inputValue || !result) && styles.saveButtonDisabled]}
          onPress={handleSaveRecord}
          disabled={!inputValue || !result}
        >
          <View style={styles.saveButtonContent}>
            <Text style={styles.saveButtonText}>📝 이 변환 기록 저장하기</Text>
            <View style={styles.adBadge}>
              <Text style={styles.adBadgeText}>AD</Text>
            </View>
          </View>
          <Text style={styles.saveButtonHint}>광고 시청 후 기록이 저장됩니다</Text>
        </TouchableOpacity>

        {/* 최근 기록 섹션 */}
        {recentRecords.length > 0 && (
          <View style={styles.historySection}>
            <TouchableOpacity
              style={styles.historyHeader}
              onPress={() => setShowHistory(!showHistory)}
            >
              <Text style={styles.historyTitle}>📋 최근 변환 기록 ({recentRecords.length})</Text>
              <Text style={styles.historyToggle}>{showHistory ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {showHistory && (
              <View style={styles.historyList}>
                {recentRecords.map((record) => (
                  <TouchableOpacity
                    key={record.id}
                    style={styles.historyItem}
                    onPress={() => applyRecord(record)}
                  >
                    <View style={styles.historyItemLeft}>
                      <Text style={styles.historyIcon}>{categoryInfo[record.category].icon}</Text>
                      <View>
                        <Text style={styles.historyText}>
                          {record.fromValue} {categoryInfo[record.category].units.find(u => u.key === record.fromUnit)?.symbol} → {record.toValue} {categoryInfo[record.category].units.find(u => u.key === record.toUnit)?.symbol}
                        </Text>
                        <Text style={styles.historyTime}>{formatTime(record.timestamp)}</Text>
                      </View>
                    </View>
                    <Text style={styles.historyApply}>적용</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* 단위 선택 피커 - From */}
      {showFromPicker && (
        <View style={styles.pickerOverlay}>
          <TouchableOpacity style={styles.pickerBackdrop} onPress={() => setShowFromPicker(false)} />
          <View style={styles.pickerContent}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>단위 선택</Text>
              <TouchableOpacity onPress={() => setShowFromPicker(false)}>
                <Text style={styles.pickerClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              {categoryInfo[category].units.map((unit) => (
                <TouchableOpacity
                  key={unit.key}
                  style={[styles.pickerItem, fromUnit.key === unit.key && styles.pickerItemActive]}
                  onPress={() => { setFromUnit(unit); setShowFromPicker(false); }}
                >
                  <Text style={[styles.pickerItemText, fromUnit.key === unit.key && styles.pickerItemTextActive]}>
                    {unit.name}
                  </Text>
                  <Text style={styles.pickerSymbol}>{unit.symbol}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* 단위 선택 피커 - To */}
      {showToPicker && (
        <View style={styles.pickerOverlay}>
          <TouchableOpacity style={styles.pickerBackdrop} onPress={() => setShowToPicker(false)} />
          <View style={styles.pickerContent}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>단위 선택</Text>
              <TouchableOpacity onPress={() => setShowToPicker(false)}>
                <Text style={styles.pickerClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              {categoryInfo[category].units.map((unit) => (
                <TouchableOpacity
                  key={unit.key}
                  style={[styles.pickerItem, toUnit.key === unit.key && styles.pickerItemActive]}
                  onPress={() => { setToUnit(unit); setShowToPicker(false); }}
                >
                  <Text style={[styles.pickerItemText, toUnit.key === unit.key && styles.pickerItemTextActive]}>
                    {unit.name}
                  </Text>
                  <Text style={styles.pickerSymbol}>{unit.symbol}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  // 카테고리 탭 - 크기 수정
  categoryContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    paddingVertical: 8,
  },
  categoryScrollContent: {
    paddingHorizontal: 12,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F1F3F5',
    marginHorizontal: 4,
    alignItems: 'center',
    minWidth: 70,
    minHeight: 56,
    justifyContent: 'center',
  },
  categoryTabActive: {
    backgroundColor: PRIMARY_COLOR,
  },
  categoryIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#495057',
  },
  categoryTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  // 퀵 프리셋
  presetSection: {
    marginBottom: 12,
  },
  presetTitle: {
    fontSize: 13,
    color: '#868E96',
    marginBottom: 8,
    marginLeft: 4,
  },
  presetChip: {
    backgroundColor: '#E8EAF6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  presetText: {
    fontSize: 13,
    color: PRIMARY_COLOR,
    fontWeight: '500',
  },
  // 메인 카드
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  label: {
    fontSize: 13,
    color: '#868E96',
    marginBottom: 8,
  },
  unitSelector: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unitName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  unitSymbol: {
    fontSize: 14,
    color: '#868E96',
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    fontSize: 20,
    marginBottom: 16,
    color: '#212529',
  },
  swapButton: {
    alignSelf: 'center',
    backgroundColor: PRIMARY_COLOR,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  swapIcon: {
    color: '#FFFFFF',
    fontSize: 22,
  },
  resultBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  resultContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultText: {
    fontSize: 24,
    fontWeight: '700',
    color: PRIMARY_COLOR,
    flex: 1,
  },
  resultUnit: {
    fontSize: 16,
    color: '#868E96',
    marginLeft: 8,
  },
  copyButton: {
    marginTop: 12,
    backgroundColor: '#E8EAF6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  copyButtonText: {
    fontSize: 13,
    color: PRIMARY_COLOR,
    fontWeight: '500',
  },
  // 공식 카드
  formulaCard: {
    backgroundColor: '#E8EAF6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  formulaText: {
    fontSize: 16,
    fontWeight: '600',
    color: PRIMARY_COLOR,
  },
  friendlyMsg: {
    fontSize: 13,
    color: '#7986CB',
    marginTop: 6,
  },
  // 저장 버튼
  saveButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#495057',
  },
  adBadge: {
    backgroundColor: '#FFF3CD',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  adBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#856404',
  },
  saveButtonHint: {
    fontSize: 12,
    color: '#ADB5BD',
  },
  // 기록 섹션
  historySection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
  },
  historyToggle: {
    fontSize: 12,
    color: '#868E96',
  },
  historyList: {
    paddingHorizontal: 8,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  historyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  historyText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212529',
  },
  historyTime: {
    fontSize: 12,
    color: '#ADB5BD',
    marginTop: 2,
  },
  historyApply: {
    fontSize: 13,
    color: PRIMARY_COLOR,
    fontWeight: '600',
  },
  // 피커
  pickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
  },
  pickerBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  pickerContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '60%',
    paddingBottom: 32,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212529',
  },
  pickerClose: {
    fontSize: 20,
    color: '#868E96',
    padding: 4,
  },
  pickerItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerItemActive: {
    backgroundColor: '#E8EAF6',
  },
  pickerItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212529',
  },
  pickerItemTextActive: {
    fontWeight: '700',
    color: PRIMARY_COLOR,
  },
  pickerSymbol: {
    fontSize: 14,
    color: '#868E96',
  },
});
