"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Clock,
  Target,
  PlayCircle,
  PauseCircle,
  RotateCcw
} from "lucide-react";

interface MockExamQuestion {
  id: string;
  section: 'vocabulary' | 'grammar' | 'reading';
  question: string;
  options: string[];
  correctAnswer: number;
  points: number;
  timeLimit?: number; // in seconds
}

interface ExamSession {
  id: string;
  totalQuestions: number;
  totalPoints: number;
  timeLimit: number; // in minutes
  questions: MockExamQuestion[];
}

interface ExamResult {
  score: number;
  totalPoints: number;
  percentage: number;
  timeUsed: number;
  sectionBreakdown: {
    vocabulary: { correct: number; total: number };
    grammar: { correct: number; total: number };
    reading: { correct: number; total: number };
  };
}

export function MockExam() {
  const [examSession, setExamSession] = useState<ExamSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{[key: string]: number}>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const submitExam = useCallback(() => {
    if (!examSession) return;

    setIsRunning(false);
    
    let score = 0;
    const sectionBreakdown = {
      vocabulary: { correct: 0, total: 0 },
      grammar: { correct: 0, total: 0 },
      reading: { correct: 0, total: 0 }
    };

    examSession.questions.forEach(question => {
      sectionBreakdown[question.section].total += question.points;
      
      if (answers[question.id] === question.correctAnswer) {
        score += question.points;
        sectionBreakdown[question.section].correct += question.points;
      }
    });

    const result: ExamResult = {
      score,
      totalPoints: examSession.totalPoints,
      percentage: Math.round((score / examSession.totalPoints) * 100),
      timeUsed: examSession.timeLimit * 60 - timeLeft,
      sectionBreakdown
    };

    setExamResult(result);
    setShowResults(true);
  }, [examSession, answers, timeLeft]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            submitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isRunning, isPaused, timeLeft, submitExam]);

  const startExam = async (type: 'mini' | 'full') => {
    setIsLoading(true);
    
    try {
      // Generate comprehensive exam data from study material
      // In real app, this would fetch from API
      const sampleQuestions: MockExamQuestion[] = [
        // ALL 20 Kanji Questions
        {
          id: 'kanji-1',
          section: 'vocabulary',
          question: '「智」の漢字の読み方として、最も適切なものはどれですか。',
          options: ['ち', 'さと', 'とも', 'し'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'kanji-2',
          section: 'vocabulary',
          question: '「暇」の正しい読み方はどれですか。',
          options: ['ひま', 'あき', 'ゆとり', 'じかん'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'kanji-3',
          section: 'vocabulary',
          question: '「繁栄」という言葉の意味として、最も適切なものはどれですか。',
          options: ['複雑', '忙しい', '栄えること', '静かな'],
          correctAnswer: 2,
          points: 1
        },
        {
          id: 'kanji-4',
          section: 'vocabulary',
          question: '「揺れる」の正しい読み方はどれですか。',
          options: ['ゆれる', 'ようれる', 'よろれる', 'ゆうれる'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'kanji-5',
          section: 'vocabulary',
          question: '「儀式」という言葉の意味として、最も適切なものはどれですか。',
          options: ['会議', 'セレモニー', '議論', '作業'],
          correctAnswer: 1,
          points: 1
        },
        {
          id: 'kanji-6',
          section: 'vocabulary',
          question: '「修理」の「修」という漢字の意味はどれですか。',
          options: ['壊す', '直す', '作る', '売る'],
          correctAnswer: 1,
          points: 1
        },
        {
          id: 'kanji-7',
          section: 'vocabulary',
          question: '「渋滞」の「渋」という漢字は、どんな意味で使われていますか。',
          options: ['苦い', '滞る', '静か', '悲しい'],
          correctAnswer: 1,
          points: 1
        },
        {
          id: 'kanji-8',
          section: 'vocabulary',
          question: '「凌ぐ」の正しい読み方はどれですか。',
          options: ['しのぐ', 'りょうぐ', 'しのぶ', 'りょうぶ'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'kanji-9',
          section: 'vocabulary',
          question: '「繕う」の正しい読み方はどれですか。',
          options: ['つくろう', 'ぜんう', 'つくのう', 'ぜんろう'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'kanji-10',
          section: 'vocabulary',
          question: '「如実」という言葉の意味として、最も適切なものはどれですか。',
          options: ['嘘のように', 'ありのままに', '少しずつ', '突然に'],
          correctAnswer: 1,
          points: 1
        },
        {
          id: 'kanji-11',
          section: 'vocabulary',
          question: '「擁護」という言葉の意味として、最も適切なものはどれですか。',
          options: ['抱きしめる', '支持する', '反対する', '攻撃する'],
          correctAnswer: 1,
          points: 1
        },
        {
          id: 'kanji-12',
          section: 'vocabulary',
          question: '「遮る」の正しい読み方はどれですか。',
          options: ['さえぎる', 'しゃる', 'さえきる', 'しゃぎる'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'kanji-13',
          section: 'vocabulary',
          question: '「赴く」の正しい読み方はどれですか。',
          options: ['おもむく', 'ふく', 'おもく', 'ふむく'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'kanji-14',
          section: 'vocabulary',
          question: '「逐一」という言葉の意味として、最も適切なものはどれですか。',
          options: ['一つ一つ', '急いで', '全て', '時々'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'kanji-15',
          section: 'vocabulary',
          question: '「憂鬱」という言葉の意味として、最も適切なものはどれですか。',
          options: ['喜び', '悲しみ', '怒り', '気分が沈むこと'],
          correctAnswer: 3,
          points: 1
        },
        {
          id: 'kanji-16',
          section: 'vocabulary',
          question: '「懲りる」という言葉の意味として、最も適切なものはどれですか。',
          options: ['失敗から学ぶ', '罰を与える', '許す', '忘れる'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'kanji-17',
          section: 'vocabulary',
          question: '「錯覚」という言葉の意味として、最も適切なものはどれですか。',
          options: ['思い違い', '正しい理解', '現実', '夢'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'kanji-18',
          section: 'vocabulary',
          question: '「挫折」という言葉の意味として、最も適切なものはどれですか。',
          options: ['成功', '途中での失敗', '挑戦', '休憩'],
          correctAnswer: 1,
          points: 1
        },
        {
          id: 'kanji-19',
          section: 'vocabulary',
          question: '「遵守」という言葉の意味として、最も適切なものはどれですか。',
          options: ['規則などを守ること', '破ること', '無視すること', '作ること'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'kanji-20',
          section: 'vocabulary',
          question: '「極まりない」という言葉の意味として、最も適切なものはどれですか。',
          options: ['少し', '普通', '非常に', '全くない'],
          correctAnswer: 2,
          points: 1
        },

        // ALL 30 Vocabulary Questions
        {
          id: 'vocab-1',
          section: 'vocabulary',
          question: '急激な為替変動が企業業績を大きく（　）。',
          options: ['揺さぶっている', '喜ばせている', '落ち着かせている', '成長させている'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'vocab-2',
          section: 'vocabulary',
          question: '時間の（　）が大きい。',
          options: ['ロス', 'ゲイン', 'プラス', 'メリット'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'vocab-3',
          section: 'vocabulary',
          question: 'カタカナの「ソ」と「リ」は（　）。',
          options: ['紛らわしい', '楽しい', '美しい', '新しい'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'vocab-4',
          section: 'vocabulary',
          question: '昨年、彼は（　）社長の後を継いだ。',
          options: ['先代', '現在', '未来', '新人'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'vocab-5',
          section: 'vocabulary',
          question: '状況が（　）動いている。',
          options: ['めまぐるしく', 'ゆっくり', '静かに', '穏やかに'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'vocab-6',
          section: 'vocabulary',
          question: '記者たちは急いで現場に（　）。',
          options: ['駆けつけた', '歩いて行った', 'ゆっくり向かった', '戻った'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'vocab-7',
          section: 'vocabulary',
          question: '突然の（　）にスタッフ一同が喜んだ。',
          options: ['朗報', '悪報', '知らせ', '連絡'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'vocab-8',
          section: 'vocabulary',
          question: '初心者には（　）が高い。',
          options: ['ハードル', 'レベル', '点数', '価格'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'vocab-9',
          section: 'vocabulary',
          question: '魚を缶詰に（　）する。',
          options: ['加工', '製造', '生産', '作成'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'vocab-10',
          section: 'vocabulary',
          question: 'トラブル発生時には（　）対応が必要だ。',
          options: ['すばやい', '慎重な', 'ゆっくりした', '適当な'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'vocab-11',
          section: 'vocabulary',
          question: '（　）、彼は来なかった。',
          options: ['案の定', '早速', '突然', '偶然'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'vocab-12',
          section: 'vocabulary',
          question: '厳しい冬を（　）。',
          options: ['凌ぐ', '楽しむ', '無視する', '避ける'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'vocab-13',
          section: 'vocabulary',
          question: '遺産を巡る（　）争い。',
          options: ['浅ましい', '美しい', '楽しい', '新しい'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'vocab-14',
          section: 'vocabulary',
          question: '人を（　）のはよくない。',
          options: ['けなす', 'ほめる', '助ける', '見る'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'vocab-15',
          section: 'vocabulary',
          question: '受賞したことは作家と認められた（　）だ。',
          options: ['証', '印', '記号', 'サイン'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'vocab-16',
          section: 'vocabulary',
          question: '彼女は内に情熱を（　）いる。',
          options: ['秘めて', '表して', '見せて', '話して'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'vocab-17',
          section: 'vocabulary',
          question: '（　）な提案をした。',
          options: ['タイムリー', 'ラッキー', 'ハッピー', 'イージー'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'vocab-18',
          section: 'vocabulary',
          question: '（　）な暮らしをしている。',
          options: ['質素', '贅沢', '派手', '華やか'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'vocab-19',
          section: 'vocabulary',
          question: '彼女は薬品の開発に（　）いる。',
          options: ['携わって', '関係して', '接触して', '連絡して'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'vocab-20',
          section: 'vocabulary',
          question: 'この（　）の事件について調べる。',
          options: ['一連', '一部', '一時', '一方'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'vocab-21',
          section: 'vocabulary',
          question: '病人を（　）。',
          options: ['労る', '怒る', '叱る', '急がせる'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'vocab-22',
          section: 'vocabulary',
          question: '（　）て人を動かす。',
          options: ['煽て', '叱っ', '怒っ', '急かし'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'vocab-23',
          section: 'vocabulary',
          question: '彼の話は（　）が合わない。',
          options: ['辻褄', '意味', '言葉', '音'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'vocab-24',
          section: 'vocabulary',
          question: '失敗に（　）て同じ過ちを犯さない。',
          options: ['懲り', '喜ん', '驚い', '困っ'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'vocab-25',
          section: 'vocabulary',
          question: '週末は（　）勉強だ。',
          options: ['専ら', '時々', 'いつも', '決して'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'vocab-26',
          section: 'vocabulary',
          question: '（　）今日は休みだと思っていた。',
          options: ['てっきり', '多分', 'もし', 'きっと'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'vocab-27',
          section: 'vocabulary',
          question: '（　）手遅れだ。',
          options: ['もはや', 'まだ', 'これから', 'すぐに'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'vocab-28',
          section: 'vocabulary',
          question: '彼は（　）交渉者だ。',
          options: ['しぶとい', '親切な', '弱い', '静かな'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'vocab-29',
          section: 'vocabulary',
          question: 'このプロジェクトは完成の（　）が立っていない。',
          options: ['目処', '計画', '予定', '準備'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'vocab-30',
          section: 'vocabulary',
          question: '彼女は（　）な努力で目標を達成した。',
          options: ['ひたむき', '適当', '簡単', '楽'],
          correctAnswer: 0,
          points: 1
        },

        // ALL 10 Phrase Questions
        {
          id: 'phrase-1',
          section: 'reading',
          question: '難しい問題に（　）。',
          options: ['頭を抱える', '手を上げる', '足を向ける', '目を閉じる'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'phrase-2',
          section: 'reading',
          question: '世界の一流企業と（　）。',
          options: ['肩を並べる', '手を組む', '足を引っ張る', '目を向ける'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'phrase-3',
          section: 'reading',
          question: '解決の（　）。',
          options: ['目処が立った', '手が出た', '足が向いた', '目が覚めた'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'phrase-4',
          section: 'reading',
          question: 'インフレに（　）。',
          options: ['拍車をかける', '手を貸す', '足を止める', '目を通す'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'phrase-5',
          section: 'reading',
          question: '彼には（　）いる。',
          options: ['一目置いて', '手を出して', '足を向けて', '目を覚まして'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'phrase-6',
          section: 'reading',
          question: '人の話に（　）ないでください。',
          options: ['口を挟ま', '手を出さ', '足を向けな', '目を向けな'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'phrase-7',
          section: 'reading',
          question: '彼が犯人だなんて、（　）。',
          options: ['耳を疑った', '目を疑った', '手を疑った', '足を疑った'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'phrase-8',
          section: 'reading',
          question: '彼女は（　）。',
          options: ['一筋縄ではいかない', '一本道で行く', '一直線に進む', '一歩ずつ歩く'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'phrase-9',
          section: 'reading',
          question: '仕事を失い（　）いる。',
          options: ['途方に暮れて', '元気に過ごして', '楽しく生活して', '忙しく働いて'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'phrase-10',
          section: 'reading',
          question: 'もう何をしても直せないなんて、本当に（　）。',
          options: ['お手上げだ', '手を下ろす', '足を上げる', '目を下げる'],
          correctAnswer: 0,
          points: 1
        },

        // ALL 15 Grammar Questions
        {
          id: 'grammar-1',
          section: 'grammar',
          question: '日本に長く住んでいる（　）、敬語には慣れない。',
          options: ['ものの', 'とはいえ', 'ざるを得ない', 'を余儀なくされる'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'grammar-2',
          section: 'grammar',
          question: '週末（　）、仕事しなければならない。',
          options: ['とはいえ', 'ものの', 'ざるを得ない', 'を余儀なくされる'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'grammar-3',
          section: 'grammar',
          question: 'この状況では決断（　）。',
          options: ['せざるを得ない', 'を禁じ得ない', 'に越したことはない', 'かねない'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'grammar-4',
          section: 'grammar',
          question: '大雨のため試合は中止（　）。',
          options: ['を余儀なくされた', 'までもない', 'ずにはすまない', 'かたがた'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'grammar-5',
          section: 'grammar',
          question: '彼の失礼な発言に怒り（　）。',
          options: ['を禁じ得ない', 'たりとも', 'てやまない', 'をおいて他にない'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'grammar-6',
          section: 'grammar',
          question: '用心する（　）。',
          options: ['に越したことはない', '極まりない', 'ものの', 'とはいえ'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'grammar-7',
          section: 'grammar',
          question: 'このままだと試験に落ち（　）。',
          options: ['かねない', 'までもない', 'ものの', 'とはいえ'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'grammar-8',
          section: 'grammar',
          question: '言う（　）ことですが…。',
          options: ['までもない', 'かねない', 'ものの', 'とはいえ'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'grammar-9',
          section: 'grammar',
          question: '誤ったなら謝ら（　）。',
          options: ['ずにはすまない', 'までもない', 'かねない', 'ものの'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'grammar-10',
          section: 'grammar',
          question: '上司に報告（　）ご挨拶に伺った。',
          options: ['かたがた', 'ずにはすまない', 'までもない', 'かねない'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'grammar-11',
          section: 'grammar',
          question: '一瞬（　）気が抜けない。',
          options: ['たりとも', 'かねない', 'までもない', 'ものの'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'grammar-12',
          section: 'grammar',
          question: '結果の（　）にかかわらず、努力を称賛します。',
          options: ['いかん', 'すべて', '一つ', '理由'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'grammar-13',
          section: 'grammar',
          question: '皆様の幸せを願っ（　）。',
          options: ['てやまない', 'かねない', 'までもない', 'ものの'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'grammar-14',
          section: 'grammar',
          question: '彼（　）リーダーに適任な人はいない。',
          options: ['をおいて他にない', 'たりとも', 'てやまない', 'までもない'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'grammar-15',
          section: 'grammar',
          question: '失礼（　）。',
          options: ['極まりない', 'をおいて他にない', 'たりとも', 'てやまない'],
          correctAnswer: 0,
          points: 1
        },

        // Listening Phrases Questions
        {
          id: 'listening-1',
          section: 'reading',
          question: '会話で「やっぱり」が使われるのはどんな時ですか。',
          options: ['予想が当たった時', '驚いた時', '怒った時', '悲しい時'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'listening-2',
          section: 'reading',
          question: '「申し訳ありません」はどんな場面で使いますか。',
          options: ['正式な謝罪', '軽い謝罪', '感謝', '挨拶'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'listening-3',
          section: 'reading',
          question: '「差し支えない」の意味として正しいものはどれですか。',
          options: ['問題ない', '困る', '嫌だ', '忙しい'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'listening-4',
          section: 'reading',
          question: '「一石二鳥」の意味はどれですか。',
          options: ['一つの行為で二つの利益', '石を二つ投げる', '鳥を二羽捕まえる', '一つずつ進める'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: 'listening-5',
          section: 'reading',
          question: '「破竹の勢い」の意味はどれですか。',
          options: ['止まらない勢い', '竹を破る力', '速い動き', '強い意志'],
          correctAnswer: 0,
          points: 1
        }
      ];

      const session: ExamSession = {
        id: Date.now().toString(),
        totalQuestions: sampleQuestions.length,
        totalPoints: sampleQuestions.reduce((acc, q) => acc + q.points, 0),
        timeLimit: type === 'mini' ? 15 : 45, // minutes
        questions: sampleQuestions
      };

      setExamSession(session);
      setTimeLeft(session.timeLimit * 60); // convert to seconds
      setCurrentQuestionIndex(0);
      setAnswers({});
      setShowResults(false);
      setExamResult(null);
      setIsRunning(true);
      setIsPaused(false);
    } catch (error) {
      console.error('Error starting exam:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPassStatus = (percentage: number) => {
    if (percentage >= 60) return { status: 'PASS', color: 'bg-green-100 text-green-800' };
    return { status: 'FAIL', color: 'bg-red-100 text-red-800' };
  };

  // Exam selection screen
  if (!examSession) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            JLPT N1 Mock Exam
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            Practice with timed mock exams to prepare for the real JLPT N1 test.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" 
                  onClick={() => startExam('mini')}>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">Mini Test</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Quick practice test
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Questions:</span>
                    <span>20</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time:</span>
                    <span>15 minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Points:</span>
                    <span>20</span>
                  </div>
                </div>
                <Button className="w-full mt-4" disabled={isLoading}>
                  {isLoading ? 'Starting...' : 'Start Mini Test'}
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" 
                  onClick={() => startExam('full')}>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Target className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="font-semibold mb-2">Full Test</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Complete practice exam
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Questions:</span>
                    <span>90</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time:</span>
                    <span>45 minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Points:</span>
                    <span>90</span>
                  </div>
                </div>
                <Button className="w-full mt-4" disabled={isLoading}>
                  {isLoading ? 'Starting...' : 'Start Full Test'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Results screen
  if (showResults && examResult) {
    const passStatus = getPassStatus(examResult.percentage);
    
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            Exam Results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Score */}
          <div className="text-center space-y-4">
            <div className="text-4xl font-bold">
              <span className={getScoreColor(examResult.percentage)}>
                {examResult.percentage}%
              </span>
            </div>
            <Badge className={passStatus.color}>
              {passStatus.status}
            </Badge>
            <div className="text-muted-foreground">
              {examResult.score} / {examResult.totalPoints} points
            </div>
            <div className="text-sm text-muted-foreground">
              Time used: {formatTime(examResult.timeUsed)}
            </div>
          </div>

          {/* Section Breakdown */}
          <div className="space-y-4">
            <h3 className="font-semibold">Section Breakdown</h3>
            {Object.entries(examResult.sectionBreakdown).map(([section, data]) => (
              <div key={section} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="capitalize font-medium">{section}</span>
                  <span className="text-sm">
                    {data.correct} / {data.total} points
                  </span>
                </div>
                <Progress 
                  value={data.total > 0 ? (data.correct / data.total) * 100 : 0} 
                  className="h-2" 
                />
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              onClick={() => setExamSession(null)}
              className="flex-1"
            >
              Take Another Exam
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowResults(false);
                setCurrentQuestionIndex(0);
                setAnswers({});
                setTimeLeft(examSession.timeLimit * 60);
                setIsRunning(true);
                setIsPaused(false);
              }}
              className="flex-1"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Exam in progress
  const currentQuestion = examSession.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / examSession.totalQuestions) * 100;
  const timeLeftMinutes = Math.floor(timeLeft / 60);
  const timeLeftSeconds = timeLeft % 60;
  const isTimeRunningOut = timeLeft < 300; // Last 5 minutes

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Exam Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                Question {currentQuestionIndex + 1} of {examSession.totalQuestions}
              </Badge>
              <Badge className="capitalize">{currentQuestion.section}</Badge>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 ${isTimeRunningOut ? 'text-red-600' : ''}`}>
                <Clock className="h-4 w-4" />
                <span className="font-mono">
                  {timeLeftMinutes}:{timeLeftSeconds.toString().padStart(2, '0')}
                </span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPaused(!isPaused)}
              >
                {isPaused ? <PlayCircle className="h-4 w-4" /> : <PauseCircle className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <Progress value={progress} className="mt-4" />
        </CardContent>
      </Card>

      {isPaused && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <PauseCircle className="h-5 w-5" />
              <span className="font-medium">Exam Paused</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              Click the play button to resume the exam.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Question */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="japanese-text text-lg leading-relaxed whitespace-pre-line">
              {currentQuestion.question}
            </div>
            
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const isSelected = answers[currentQuestion.id] === index;
                
                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(currentQuestion.id, index)}
                    disabled={isPaused}
                    className={`w-full p-4 text-left rounded-lg border transition-colors touch-target ${
                      isSelected
                        ? 'bg-primary/10 border-primary'
                        : 'bg-card border-border hover:bg-muted'
                    } ${isPaused ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium min-w-[20px]">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      <span className="japanese-text">{option}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0 || isPaused}
            >
              Previous
            </Button>
            
            <span className="text-sm text-muted-foreground">
              {Object.keys(answers).length} / {examSession.totalQuestions} answered
            </span>
            
            {currentQuestionIndex === examSession.totalQuestions - 1 ? (
              <Button
                onClick={submitExam}
                disabled={isPaused}
                className="bg-green-600 hover:bg-green-700"
              >
                Submit Exam
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentQuestionIndex(prev => Math.min(examSession.totalQuestions - 1, prev + 1))}
                disabled={isPaused}
              >
                Next
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
