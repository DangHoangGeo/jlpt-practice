// Sample data import script for JLPT Practice App
// Run this to populate your database with test data

const API_BASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ? 
  `${process.env.NEXT_PUBLIC_SUPABASE_URL.replace('/supabase', '')}/api` : 
  'http://localhost:3000/api';

// Sample vocabulary data
const sampleVocabulary = [
  {
    term: "幸福",
    reading: "こうふく",
    meaning_en: "happiness, good fortune",
    meaning_vi: "hạnh phúc, may mắn",
    example_jp: "家族と過ごす時間が私の幸福です。"
  },
  {
    term: "複雑",
    reading: "ふくざつ",
    meaning_en: "complex, complicated",
    meaning_vi: "phức tạp",
    example_jp: "この問題は非常に複雑だ。"
  },
  {
    term: "著名",
    reading: "ちょめい",
    meaning_en: "famous, well-known",
    meaning_vi: "nổi tiếng, có danh tiếng",
    example_jp: "彼は著名な作家です。"
  },
  {
    term: "継続",
    reading: "けいぞく",
    meaning_en: "continuation, continuance",
    meaning_vi: "tiếp tục, duy trì",
    example_jp: "努力の継続が成功の鍵だ。"
  },
  {
    term: "優秀",
    reading: "ゆうしゅう",
    meaning_en: "excellent, outstanding",
    meaning_vi: "xuất sắc, ưu tú",
    example_jp: "彼女は優秀な学生です。"
  }
];

// Sample grammar data
const sampleGrammar = [
  {
    pattern: "～か～ないかのうちに",
    description: "while deciding whether to do something or not; as soon as",
    example: "行く_____、電話が鳴った。"
  },
  {
    pattern: "～をはじめ（として）",
    description: "starting with; including",
    example: "日本_____、アジア諸国で人気がある。"
  },
  {
    pattern: "～に関して",
    description: "regarding, concerning, with regard to",
    example: "この件_____、詳しく説明します。"
  },
  {
    pattern: "～によると",
    description: "according to",
    example: "天気予報_____、明日は雨だそうです。"
  },
  {
    pattern: "～に反して",
    description: "contrary to, against",
    example: "予想_____、試験は簡単だった。"
  }
];

// Sample vocabulary questions
const sampleVocabQuestions = [
  {
    vocabulary_item_id: null, // Will be set dynamically
    question_text: "「幸福」の意味として最も適切なものはどれですか？",
    options: ["happiness, good fortune", "sadness, misfortune", "anger, rage", "confusion, disorder"],
    answer_index: 0,
    explanation: "「幸福」は happiness, good fortune を意味します。家族との時間など、心の満足を表現する際に使われます。"
  },
  {
    vocabulary_item_id: null,
    question_text: "「複雑」を使った適切な文はどれですか？",
    options: [
      "この問題は非常に複雑だ。",
      "この問題は非常に簡単だ。", 
      "この問題は非常に楽しい。",
      "この問題は非常に静かだ。"
    ],
    answer_index: 0,
    explanation: "「複雑」はcomplexやcomplicatedを意味し、問題や状況が入り組んでいることを表します。"
  }
];

// Sample grammar questions
const sampleGrammarQuestions = [
  {
    grammar_item_id: null,
    question_text: "行く（　　）、電話が鳴った。",
    options: ["か行かないかのうちに", "ために", "ので", "けれども"],
    answer_index: 0,
    explanation: "「か～ないかのうちに」は「～しようかどうか迷っているうちに」という意味で、何かを決断する前に別のことが起こることを表します。"
  },
  {
    grammar_item_id: null,
    question_text: "日本（　　）、アジア諸国で人気がある。",
    options: ["をはじめとして", "について", "によって", "に対して"],
    answer_index: 0,
    explanation: "「をはじめ（として）」は「starting with」の意味で、例を挙げる時に使います。"
  }
];

// Sample tips
const sampleTips = [
  {
    section: "vocabulary",
    tip_text: "新しい語彙を学ぶ際は、単語帳よりも文脈の中で覚えることが効果的です。例文と一緒に覚えましょう。"
  },
  {
    section: "vocabulary", 
    tip_text: "漢字の読み方は音読みと訓読みがあります。語彙の成り立ちを理解すると記憶に残りやすくなります。"
  },
  {
    section: "reading",
    tip_text: "長文読解では、まず全体の構造を把握してから詳細を読み進めることが重要です。"
  },
  {
    section: "reading",
    tip_text: "分からない単語があっても立ち止まらず、文脈から意味を推測する習慣をつけましょう。"
  },
  {
    section: "listening",
    tip_text: "聞き取り練習では、完璧に理解しようとせず、キーワードを拾うことから始めましょう。"
  },
  {
    section: "listening",
    tip_text: "日本のニュースやドラマを字幕なしで見る習慣をつけると、自然な日本語に慣れることができます。"
  }
];

async function importData() {
  try {
    console.log('Starting data import...');

    // Import vocabulary
    console.log('Importing vocabulary...');
    const vocabResponse = await fetch(`${API_BASE_URL}/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        section: 'word',
        source: 'manual-sample-data',
        raw_data: sampleVocabulary
      })
    });

    if (!vocabResponse.ok) {
      throw new Error(`Vocabulary import failed: ${vocabResponse.status}`);
    }

    // Import grammar
    console.log('Importing grammar...');
    const grammarResponse = await fetch(`${API_BASE_URL}/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        section: 'grammar',
        source: 'manual-sample-data',
        raw_data: sampleGrammar
      })
    });

    if (!grammarResponse.ok) {
      throw new Error(`Grammar import failed: ${grammarResponse.status}`);
    }

    // Import vocab questions
    console.log('Importing vocabulary questions...');
    const vocabQuestionsResponse = await fetch(`${API_BASE_URL}/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        section: 'vocab_questions',
        source: 'manual-sample-data',
        raw_data: sampleVocabQuestions
      })
    });

    if (!vocabQuestionsResponse.ok) {
      throw new Error(`Vocabulary questions import failed: ${vocabQuestionsResponse.status}`);
    }

    // Import grammar questions
    console.log('Importing grammar questions...');
    const grammarQuestionsResponse = await fetch(`${API_BASE_URL}/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        section: 'grammar_questions',
        source: 'manual-sample-data',
        raw_data: sampleGrammarQuestions
      })
    });

    if (!grammarQuestionsResponse.ok) {
      throw new Error(`Grammar questions import failed: ${grammarQuestionsResponse.status}`);
    }

    // Import tips
    console.log('Importing tips...');
    const tipsResponse = await fetch(`${API_BASE_URL}/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        section: 'tips',
        source: 'manual-sample-data',
        raw_data: sampleTips
      })
    });

    if (!tipsResponse.ok) {
      throw new Error(`Tips import failed: ${tipsResponse.status}`);
    }

    console.log('✅ Data import completed successfully!');
    
  } catch (error) {
    console.error('❌ Data import failed:', error);
  }
}

// Export for use in other scripts
export { sampleVocabulary, sampleGrammar, sampleVocabQuestions, sampleGrammarQuestions, sampleTips, importData };

// Run import if this file is executed directly
if (typeof window === 'undefined' && require.main === module) {
  importData();
}
