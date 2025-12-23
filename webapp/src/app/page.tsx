'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { getTelegramWebApp } from '@/lib/telegram';
import { Screen, SessionData, Question, Answer, TestResult } from '@/types';

import LoadingScreen from '@/components/LoadingScreen';
import GatingScreen from '@/components/GatingScreen';
import StartScreen from '@/components/StartScreen';
import QuestionScreen from '@/components/QuestionScreen';
import CooldownScreen from '@/components/CooldownScreen';
import ResultScreen from '@/components/ResultScreen';

const CHANNEL_URL = process.env.NEXT_PUBLIC_CHANNEL_URL || 'https://t.me/stalkermedia';

export default function Home() {
  const [screen, setScreen] = useState<Screen>('loading');
  const [session, setSession] = useState<SessionData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [result, setResult] = useState<TestResult | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [loading, setLoading] = useState(false);

  // Initialize Telegram WebApp and session
  useEffect(() => {
    const init = async () => {
      // Initialize Telegram WebApp
      const tg = getTelegramWebApp();
      if (tg) {
        tg.ready();
        tg.expand();
      }

      try {
        // Init session
        const sessionData = await api.init();

        if (sessionData.success) {
          const newSession: SessionData = {
            user: {
              id: sessionData.user.telegram_id,
              first_name: sessionData.user.first_name,
              username: sessionData.user.username,
            },
            isSubscribed: sessionData.isSubscribed,
            canStart: sessionData.canStart,
            cooldownSecondsLeft: sessionData.cooldownSecondsLeft,
            needsContact: sessionData.needsContact,
          };
          setSession(newSession);

          // Determine initial screen
          if (!newSession.canStart) {
            setCooldownSeconds(newSession.cooldownSecondsLeft);
            setScreen('cooldown');
          } else if (newSession.needsContact) {
            setScreen('gating');
          } else {
            setScreen('start');
          }
        } else {
          // Fallback for development without backend
          setSession({
            user: { id: 0, first_name: 'Тестер' },
            isSubscribed: false,
            canStart: true,
            cooldownSecondsLeft: 0,
            needsContact: true,
          });
          setScreen('gating');
        }

        // Load questions
        const questionsData = await api.getQuestions();
        if (questionsData.success) {
          setQuestions(questionsData.questions as Question[]);
        }
      } catch (error) {
        console.error('Init error:', error);
        // Fallback for development
        setSession({
          user: { id: 0, first_name: 'Гость' },
          isSubscribed: false,
          canStart: true,
          cooldownSecondsLeft: 0,
          needsContact: true,
        });
        setScreen('gating');
      }
    };

    init();
  }, []);

  // Subscription check handler
  const handleSubscriptionCheck = useCallback(async (): Promise<boolean> => {
    try {
      const result = await api.checkSubscription();
      if (result.success && result.isSubscribed) {
        setSession(prev => prev ? { ...prev, needsContact: false } : null);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  // Contact save handler
  const handleContactSave = useCallback(async (phone: string): Promise<boolean> => {
    try {
      const result = await api.saveLead(phone);
      if (result.success) {
        setSession(prev => prev ? { ...prev, needsContact: false } : null);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  // Start test handler
  const handleStartTest = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.startAttempt();

      if (result.success && result.attemptId) {
        setAttemptId(result.attemptId);
        setCurrentIndex(0);
        setAnswers([]);
        setScreen('questions');
      } else if (result.cooldownSecondsLeft) {
        setCooldownSeconds(result.cooldownSecondsLeft);
        setScreen('cooldown');
      }
    } catch (error) {
      console.error('Start error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Answer handler
  const handleAnswer = useCallback(async (questionId: number, answer: 'a' | 'b' | 'c' | 'd' | 'e') => {
    setLoading(true);

    // Save answer locally
    const newAnswer: Answer = { questionId, answer };
    const updatedAnswers = [...answers.filter(a => a.questionId !== questionId), newAnswer];
    setAnswers(updatedAnswers);

    try {
      // Save to backend
      if (attemptId) {
        await api.saveAnswer(attemptId, questionId, answer);
      }

      // Move to next question or finish
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // Finish test
        if (attemptId) {
          const finishResult = await api.finishAttempt(attemptId);
          if (finishResult.success && finishResult.result) {
            setResult(finishResult.result as TestResult);
            setScreen('result');
          }
        }
      }
    } catch (error) {
      console.error('Answer error:', error);
    } finally {
      setLoading(false);
    }
  }, [answers, attemptId, currentIndex, questions.length]);

  // Back handler for questions
  const handleBack = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  // Retry handler
  const handleRetry = useCallback(() => {
    setResult(null);
    setAttemptId(null);
    setAnswers([]);
    setCurrentIndex(0);
    setScreen('start');
  }, []);

  // Refresh cooldown handler
  const handleRefreshCooldown = useCallback(async () => {
    try {
      const sessionData = await api.init();
      if (sessionData.success) {
        if (sessionData.canStart) {
          setScreen('start');
        } else {
          setCooldownSeconds(sessionData.cooldownSecondsLeft);
        }
      }
    } catch (error) {
      console.error('Refresh error:', error);
    }
  }, []);

  // Close handler
  const handleClose = useCallback(() => {
    const tg = getTelegramWebApp();
    if (tg?.close) {
      tg.close();
    }
  }, []);

  // Render screens
  switch (screen) {
    case 'loading':
      return <LoadingScreen />;

    case 'gating':
      return (
        <GatingScreen
          firstName={session?.user.first_name || 'Друг'}
          channelUrl={CHANNEL_URL}
          onSubscriptionCheck={handleSubscriptionCheck}
          onContactSave={handleContactSave}
          onContinue={() => setScreen('start')}
        />
      );

    case 'start':
      return (
        <StartScreen
          firstName={session?.user.first_name || 'Друг'}
          onStart={handleStartTest}
          loading={loading}
        />
      );

    case 'questions':
      return (
        <QuestionScreen
          questions={questions}
          currentIndex={currentIndex}
          answers={answers}
          onAnswer={handleAnswer}
          onBack={handleBack}
          loading={loading}
        />
      );

    case 'cooldown':
      return (
        <CooldownScreen
          secondsLeft={cooldownSeconds}
          onRefresh={handleRefreshCooldown}
          onClose={handleClose}
        />
      );

    case 'result':
      return result ? (
        <ResultScreen
          result={result}
          canRetry={false}
          onRetry={handleRetry}
        />
      ) : (
        <LoadingScreen />
      );

    default:
      return <LoadingScreen />;
  }
}
