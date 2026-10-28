/**
 * hooks/useSpeechSynthesis.ts
 * Custom hook untuk mengelola sintesis suara Text-to-Speech (TTS) di browser.
 * Mengutamakan pemilihan profil suara berbahasa Indonesia ('id-ID').
 */

import { useEffect, useCallback } from 'react';

export function useSpeechSynthesis() {
    useEffect(() => {
        const loadVoices = () => {
            if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.getVoices();
            }
        };
        loadVoices();
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
    }, []);

    const speak = useCallback((text: string) => {
        if (!text || text.trim() === '' || typeof window === 'undefined') return;

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'id-ID';
        utterance.rate = 0.9;

        const voices = window.speechSynthesis.getVoices();
        const indonesianVoice = voices.find(
            (v) => v.lang === 'id-ID' || v.lang === 'id_ID' || v.lang === 'id'
        );
        if (indonesianVoice) {
            utterance.voice = indonesianVoice;
        }

        window.speechSynthesis.speak(utterance);
    }, []);

    const stop = useCallback(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    }, []);

    return { speak, stop };
}
