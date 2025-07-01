#!/usr/bin/env node

/**
 * JLPT Practice App - Database Seeding Script
 * 
 * This script populates the database with sample vocabulary, grammar, questions, and tips.
 * Run this after setting up your Supabase database schema.
 * 
 * Usage: node scripts/seed-database.js
 */

const BASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('/supabase', '') || 'http://localhost:3001';

// Sample vocabulary items
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
  },
  {
    term: "曖昧",
    reading: "あいまい",
    meaning_en: "vague, ambiguous",
    meaning_vi: "mơ hồ, không rõ ràng",
    example_jp: "彼の説明は曖昧すぎる。"
  },
  {
    term: "憂鬱",
    reading: "ゆううつ",
    meaning_en: "depression, melancholy",
    meaning_vi: "u sầu, trầm cảm",
    example_jp: "雨の日は憂鬱な気分になる。"
  },
  {
    term: "偶然",
    reading: "ぐうぜん",
    meaning_en: "coincidence, accident",
    meaning_vi: "tình cờ, ngẫu nhiên",
    example_jp: "偶然彼に会った。"
  }
];

// Sample grammar patterns
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
  },
  {
    pattern: "～にしては",
    description: "for; considering that",
    example: "子供_____、よく勉強する。"
  },
  {
    pattern: "～をめぐって",
    description: "concerning, regarding, over (an issue)",
    example: "環境問題_____議論が続いている。"
  }
];

// Sample vocabulary questions
const sampleVocabQuestions = [
  {
    vocabulary_item_id: null,
    question_text: "「幸福」の意味として最も適切なものはどれですか？",
    options: [
      "happiness, good fortune",
      "sadness, misfortune", 
      "anger, rage",
      "confusion, disorder"
    ],
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
  },
  {
    vocabulary_item_id: null,
    question_text: "「著名」の読み方はどれですか？",
    options: [
      "ちょめい",
      "ちゃくめい",
      "ちょうめい",
      "ちゃめい"
    ],
    answer_index: 0,
    explanation: "「著名」は「ちょめい」と読み、famous や well-known を意味します。"
  }
];

// Sample grammar questions
const sampleGrammarQuestions = [
  {
    grammar_item_id: null,
    question_text: "行く（　　）、電話が鳴った。",
    options: [
      "か行かないかのうちに",
      "ために",
      "ので", 
      "けれども"
    ],
    answer_index: 0,
    explanation: "「か～ないかのうちに」は「～しようかどうか迷っているうちに」という意味で、何かを決断する前に別のことが起こることを表します。"
  },
  {
    grammar_item_id: null,
    question_text: "日本（　　）、アジア諸国で人気がある。",
    options: [
      "をはじめとして",
      "について",
      "によって",
      "に対して"
    ],
    answer_index: 0,
    explanation: "「をはじめ（として）」は「starting with」の意味で、例を挙げる時に使います。"
  },
  {
    grammar_item_id: null,
    question_text: "この件（　　）、詳しく説明します。",
    options: [
      "に関して",
      "によって",
      "について",
      "に対して"
    ],
    answer_index: 0,
    explanation: "「に関して」は「regarding」「concerning」の意味で、何かについて述べる時に使います。"
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
    section: "vocabulary",
    tip_text: "毎日少しずつでも新しい語彙に触れることが重要です。スマートフォンアプリを活用して隙間時間を有効活用しましょう。"
  },
  {
    section: "vocabulary",
    tip_text: "同義語や類義語をセットで覚えると、語彙の理解が深まり、より自然な表現ができるようになります。"
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
    section: "reading",
    tip_text: "速読練習では、指や鉛筆を使って視線を誘導し、読み返しを減らす技術を身に付けましょう。"
  },
  {
    section: "listening",
    tip_text: "聞き取り練習では、完璧に理解しようとせず、キーワードを拾うことから始めましょう。"
  },
  {
    section: "listening",
    tip_text: "日本のニュースやドラマを字幕なしで見る習慣をつけると、自然な日本語に慣れることができます。"
  },
  {
    section: "listening",
    tip_text: "シャドーイング（聞こえた音をそのまま復唱する）練習は、リスニング力向上に非常に効果的です。"
  }
];

async function importData(section, data, description) {
  try {
    console.log(`📥 Importing ${description}...`);
    
    const response = await fetch(`${BASE_URL}/api/seed-simple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'JLPT-Practice-Seeder/1.0'
      },
      body: JSON.stringify({
        section,
        data,
        admin_key: 'seed-initial-data-2025'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log(`✅ Successfully imported ${result.imported_count} ${description}`);
    return result;
    
  } catch (error) {
    console.error(`❌ Failed to import ${description}:`, error.message);
    throw error;
  }
}

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');
  console.log(`🔗 Target URL: ${BASE_URL}`);
  console.log('');
  
  try {
    // Import vocabulary
    await importData('vocabulary', sampleVocabulary, 'vocabulary items');
    
    // Import grammar
    await importData('grammar', sampleGrammar, 'grammar patterns');
    
    // Import vocabulary questions
    await importData('vocab_questions', sampleVocabQuestions, 'vocabulary questions');
    
    // Import grammar questions  
    await importData('grammar_questions', sampleGrammarQuestions, 'grammar questions');
    
    // Import tips
    await importData('tips', sampleTips, 'study tips');
    
    console.log('');
    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. 🚀 Start the development server: npm run dev');
    console.log('2. 📱 Open http://localhost:3000');
    console.log('3. 👤 Create an account and start practicing!');
    
  } catch (error) {
    console.error('');
    console.error('💥 Database seeding failed:', error.message);
    console.error('');
    console.error('Please check:');
    console.error('- Your .env.local file is configured correctly');
    console.error('- The development server is running (npm run dev)');
    console.error('- The database schema has been set up in Supabase');
    console.error('- You are authenticated in the application');
    process.exit(1);
  }
}

// Run the seeding if this script is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = {
  seedDatabase,
  sampleVocabulary,
  sampleGrammar,
  sampleVocabQuestions,
  sampleGrammarQuestions,
  sampleTips
};
