import { useState, useEffect } from 'react';
import type { CalculatedResult } from '@stalker/shared';
import { saveResult } from '../lib/api';

interface ResultProps {
    testCode: string;
    result: CalculatedResult;
    onBack: () => void;
}

function Result({ testCode, result, onBack }: ResultProps) {
    const [phone, setPhone] = useState('');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [showPhone, setShowPhone] = useState(false);

    // Автосохранение при первой загрузке
    useEffect(() => {
        async function autoSave() {
            try {
                setSaving(true);
                await saveResult({
                    test_code: testCode,
                    result_type: result.result_type,
                    result_title: result.result_title,
                });
                setSaved(true);
            } catch (err) {
                console.error('Auto-save failed:', err);
            } finally {
                setSaving(false);
            }
        }

        autoSave();
    }, [testCode, result]);

    const handleSaveWithPhone = async () => {
        if (!phone.trim()) return;

        try {
            setSaving(true);
            await saveResult({
                test_code: testCode,
                result_type: result.result_type,
                result_title: result.result_title,
                phone: phone.trim(),
            });
            setShowPhone(false);
            setSaved(true);
        } catch (err) {
            console.error('Save with phone failed:', err);
        } finally {
            setSaving(false);
        }
    };

    const formatPhone = (value: string) => {
        // Простая маска для телефона
        const digits = value.replace(/\D/g, '');
        if (digits.length <= 1) return '+' + digits;
        if (digits.length <= 4) return `+${digits.slice(0, 1)} (${digits.slice(1)}`;
        if (digits.length <= 7) return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4)}`;
        if (digits.length <= 9) return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
        return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
    };

    // Иконки для разных типов
    const getEmoji = () => {
        const emojiMap: Record<string, string> = {
            // Теремок
            bird: '🐦',
            hamster: '🐹',
            fox: '🦊',
            professional: '💼',
            wolf: '🐺',
            bear: '🐻',
            rat: '🐀',
            // Формула
            resultnik: '🎯',
            processnik: '⚙️',
            statusnik: '👔',
        };
        return emojiMap[result.result_type] || '🏆';
    };

    return (
        <div className="result">
            <div className="result__icon">{getEmoji()}</div>
            <h2 className="result__title">Ваш результат</h2>
            <p className="result__type">{result.result_title}</p>

            {result.result_description && (
                <p className="result__description">{result.result_description}</p>
            )}

            {saving ? (
                <p className="result__saved">⏳ Сохранение...</p>
            ) : saved ? (
                <p className="result__saved">✓ Результат сохранён</p>
            ) : null}

            {!showPhone ? (
                <>
                    <button
                        className="btn btn--secondary mb-16"
                        onClick={() => setShowPhone(true)}
                    >
                        📞 Оставить телефон для связи
                    </button>

                    <button className="btn btn--primary" onClick={onBack}>
                        Пройти другой тест
                    </button>
                </>
            ) : (
                <>
                    <div className="input-group" style={{ textAlign: 'left' }}>
                        <label className="input-group__label">
                            Ваш номер телефона (необязательно)
                        </label>
                        <input
                            type="tel"
                            className="input-group__input"
                            placeholder="+375 (XX) XXX-XX-XX"
                            value={phone}
                            onChange={(e) => setPhone(formatPhone(e.target.value))}
                        />
                    </div>

                    <button
                        className="btn btn--primary mb-16"
                        onClick={handleSaveWithPhone}
                        disabled={saving || !phone.trim()}
                    >
                        {saving ? 'Сохранение...' : 'Сохранить телефон'}
                    </button>

                    <button className="btn btn--ghost" onClick={() => setShowPhone(false)}>
                        Пропустить
                    </button>
                </>
            )}
        </div>
    );
}

export default Result;
