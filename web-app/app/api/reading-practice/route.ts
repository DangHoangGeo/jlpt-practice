import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { geminiService } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if Gemini API key is configured
    if (!process.env.GOOGLE_AI_API_KEY) {
      return NextResponse.json({ 
        error: 'AI reading practice is not configured. Please set GOOGLE_AI_API_KEY environment variable.' 
      }, { status: 503 })
    }

    const body = await request.json()
    const { 
      passage,
      question_count = 5,
      difficulty = 'N1'
    } = body

    if (!passage || passage.trim().length < 100) {
      return NextResponse.json({ 
        error: 'Passage must be at least 100 characters long' 
      }, { status: 400 })
    }

    // Generate reading practice questions
    const readingPractice = await geminiService.generateReadingPractice(
      passage,
      difficulty,
      question_count
    )

    // Save the reading practice session
    try {
      await supabase
        .from('activity_log')
        .insert({
          user_id: user.id,
          activity_type: 'reading_practice_generated',
          details: {
            passage_length: passage.length,
            question_count,
            difficulty,
            practice_data: readingPractice
          }
        })
    } catch (logError) {
      console.error('Error logging reading practice:', logError)
    }

    return NextResponse.json({ 
      reading_practice: readingPractice,
      generated_at: new Date().toISOString(),
      passage_info: {
        length: passage.length,
        difficulty,
        question_count
      }
    })

  } catch (error) {
    console.error('Error generating reading practice:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to generate reading practice' 
    }, { status: 500 })
  }
}

// Get sample passages for practice
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const topic = searchParams.get('topic')

    // Sample N1-level passages
    const samplePassages = [
      {
        id: 'passage_1',
        title: '日本の少子高齢化社会',
        topic: 'society',
        content: `日本は現在、世界で類を見ない速度で少子高齢化が進行している。2023年の統計によると、65歳以上の高齢者人口が全人口の29.1％を占め、出生率は1.26まで低下した。この現象は、労働力不足、社会保障費の増大、地域経済の衰退など、多方面にわたって深刻な影響を及ぼしている。

政府は「一億総活躍社会」の実現を目指し、働き方改革や子育て支援の充実を図っているが、根本的な解決には至っていない。専門家の間では、移民政策の見直しや、AI・ロボット技術の活用による生産性向上が議論されている。しかし、これらの対策も即効性に欠け、長期的な視点での社会構造の変革が求められている。

特に注目すべきは、地方自治体における人口減少の加速である。過疎化が進む地域では、公共サービスの維持が困難になりつつあり、「消滅可能性都市」という概念まで生まれている。一方で、テレワークの普及により、都市部から地方への移住を促進する「地方創生」の取り組みも活発化している。`,
        difficulty: 'N1',
        word_count: 356
      },
      {
        id: 'passage_2',
        title: '人工知能と労働市場の変化',
        topic: 'technology',
        content: `人工知能（AI）の急速な発達は、労働市場に革命的な変化をもたらしている。従来、人間の専売特許とされていた創造的な作業や複雑な判断を要する業務においても、AIが人間と同等、あるいはそれ以上の性能を発揮するケースが増えている。

この技術革新により、多くの職種が自動化の波にさらされる一方で、新たな雇用機会も創出されている。データサイエンティストやAIエンジニアなど、技術に特化した職業の需要は急激に高まっているが、これらの職業に就くためには高度な専門知識が必要とされる。

企業においても、AI導入による効率化と生産性向上が期待される一方で、従業員の再教育や職業転換への対応が急務となっている。政府は「リスキリング」政策を推進し、労働者のスキル向上を支援しているが、技術の進歩速度に教育制度が追いついていない現状がある。

今後は、人間とAIが協働する新しい働き方を模索し、技術の恩恵を社会全体で共有できる仕組みづくりが重要となるだろう。`,
        difficulty: 'N1',
        word_count: 342
      }
    ];

    let filteredPassages = samplePassages;
    if (topic) {
      filteredPassages = samplePassages.filter(p => p.topic === topic);
    }

    return NextResponse.json({ 
      passages: filteredPassages,
      total_count: filteredPassages.length
    })

  } catch (error) {
    console.error('Error fetching sample passages:', error)
    return NextResponse.json({ error: 'Failed to fetch passages' }, { status: 500 })
  }
}
