'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Brain, Target, Clock, Trophy, TrendingUp, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface TestRecord {
  id: string
  test_name: string
  test_type: string
  difficulty_level: string
  total_questions: number
  estimated_time_minutes: number
  focus_areas: string[]
  created_at: string
  started_at?: string
  completed_at?: string
  score?: number
  time_taken_ms?: number
  ai_analysis: {
    performance_summary: string
    recommended_focus: string[]
    difficulty_distribution: {
      easy: number
      medium: number
      hard: number
    }
    test_strategy: string
  }
}

interface PracticeList {
  id: string
  name: string
  item_count: number
}

export default function PersonalizedTestManager() {
  const [tests, setTests] = useState<TestRecord[]>([])
  const [practiceLists, setPracticeLists] = useState<PracticeList[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [generatingTest, setGeneratingTest] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchTests()
    fetchPracticeLists()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTests = async () => {
    try {
      const response = await fetch('/api/personalized-tests')
      if (response.ok) {
        const data = await response.json()
        setTests(data.tests)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch tests",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error fetching tests:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPracticeLists = async () => {
    try {
      const response = await fetch('/api/practice-lists')
      if (response.ok) {
        const data = await response.json()
        setPracticeLists(data.lists)
      }
    } catch (error) {
      console.error('Error fetching practice lists:', error)
    }
  }

  const generatePersonalizedTest = async (formData: {
    testName: string
    testType: string
    questionCount: number
    difficultyLevel: string
    focusAreas: string[]
    practiceListId?: string
  }) => {
    setGeneratingTest(true)
    try {
      const response = await fetch('/api/personalized-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          test_name: formData.testName,
          test_type: formData.testType,
          question_count: formData.questionCount,
          difficulty_level: formData.difficultyLevel,
          focus_areas: formData.focusAreas,
          practice_list_id: formData.practiceListId
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Success",
          description: "Personalized test generated successfully!"
        })
        fetchTests()
        setIsCreateDialogOpen(false)
        
        // Redirect to the test
        window.location.href = `/quiz?test_id=${data.test.id}`
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to generate test",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error generating test:', error)
      toast({
        title: "Error",
        description: "An error occurred while generating the test",
        variant: "destructive"
      })
    } finally {
      setGeneratingTest(false)
    }
  }

  const startTest = (testId: string) => {
    window.location.href = `/quiz?test_id=${testId}`
  }

  const viewTestResults = (testId: string) => {
    window.location.href = `/quiz/results?test_id=${testId}`
  }

  const getTestStatusBadge = (test: TestRecord) => {
    if (test.completed_at) {
      return <Badge variant="default" className="bg-green-500">Completed</Badge>
    } else if (test.started_at) {
      return <Badge variant="secondary">In Progress</Badge>
    } else {
      return <Badge variant="outline">Ready</Badge>
    }
  }

  const formatDuration = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000)
    const seconds = Math.floor((milliseconds % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Personalized Tests</h1>
          <p className="text-gray-600">AI-generated tests based on your learning progress</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Brain className="mr-2 h-4 w-4" />
              Generate Test
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Generate Personalized Test</DialogTitle>
              <DialogDescription>
                Our AI will analyze your learning progress and create a customized test for you.
              </DialogDescription>
            </DialogHeader>
            <CreateTestForm
              practiceLists={practiceLists}
              onSubmit={generatePersonalizedTest}
              generating={generatingTest}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => {
          generatePersonalizedTest({
            testName: `Quick Mock Exam ${new Date().toLocaleDateString()}`,
            testType: 'mock_exam',
            questionCount: 30,
            difficultyLevel: 'mixed',
            focusAreas: ['weakness_focus']
          })
        }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-blue-500" />
              <div>
                <h3 className="font-semibold">Quick Mock Exam</h3>
                <p className="text-sm text-gray-600">AI-generated based on weaknesses</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => {
          generatePersonalizedTest({
            testName: `Weakness Focus ${new Date().toLocaleDateString()}`,
            testType: 'weakness_focus',
            questionCount: 20,
            difficultyLevel: 'hard',
            focusAreas: ['difficult_items']
          })
        }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-orange-500" />
              <div>
                <h3 className="font-semibold">Weakness Focus</h3>
                <p className="text-sm text-gray-600">Target your weak areas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setIsCreateDialogOpen(true)}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Brain className="h-8 w-8 text-purple-500" />
              <div>
                <h3 className="font-semibold">Custom Test</h3>
                <p className="text-sm text-gray-600">Create with specific settings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test History */}
      <Card>
        <CardHeader>
          <CardTitle>Your Tests</CardTitle>
          <CardDescription>Track your progress with AI-generated personalized tests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tests.map((test) => (
              <div key={test.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{test.test_name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {getTestStatusBadge(test)}
                      <Badge variant="outline">{test.test_type.replace('_', ' ')}</Badge>
                      <Badge variant="outline">{test.difficulty_level}</Badge>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-600">
                    {new Date(test.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{test.total_questions} questions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">~{test.estimated_time_minutes} min</span>
                  </div>
                  {test.score !== undefined && (
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{test.score ? test.score.toFixed(1) : 0}% score</span>
                    </div>
                  )}
                  {test.time_taken_ms && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{formatDuration(test.time_taken_ms)} taken</span>
                    </div>
                  )}
                </div>

                {test.focus_areas.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Focus Areas:</p>
                    <div className="flex flex-wrap gap-1">
                      {test.focus_areas.map((area, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {area.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {test.ai_analysis && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      AI Analysis
                    </h4>
                    <p className="text-sm text-gray-700 mb-2">{test.ai_analysis.performance_summary}</p>
                    <div className="text-xs text-gray-600">
                      <strong>Strategy:</strong> {test.ai_analysis.test_strategy}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  {!test.completed_at ? (
                    <Button onClick={() => startTest(test.id)}>
                      {test.started_at ? 'Continue Test' : 'Start Test'}
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={() => viewTestResults(test.id)}>
                      View Results
                    </Button>
                  )}
                  {test.completed_at && test.score && test.score < 70 && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        generatePersonalizedTest({
                          testName: `Retry: ${test.test_name}`,
                          testType: 'practice_test',
                          questionCount: test.total_questions,
                          difficultyLevel: test.difficulty_level,
                          focusAreas: test.focus_areas
                        })
                      }}
                    >
                      <AlertCircle className="mr-2 h-4 w-4" />
                      Retry Test
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {tests.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Brain className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No tests generated yet. Create your first personalized test!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface CreateTestFormData {
  testName: string
  testType: string
  questionCount: number
  difficultyLevel: string
  focusAreas: string[]
  practiceListId?: string
}

function CreateTestForm({
  practiceLists,
  onSubmit,
  generating
}: {
  practiceLists: PracticeList[]
  onSubmit: (formData: CreateTestFormData) => void
  generating: boolean
}) {
  const [testName, setTestName] = useState('')
  const [testType, setTestType] = useState('practice_test')
  const [questionCount, setQuestionCount] = useState(20)
  const [difficultyLevel, setDifficultyLevel] = useState('mixed')
  const [practiceListId, setPracticeListId] = useState<string>('__none__')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (testName.trim()) {
      onSubmit({
        testName,
        testType,
        questionCount,
        difficultyLevel,
        focusAreas: [], // Default empty for now
        practiceListId: practiceListId === '__none__' ? undefined : practiceListId
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="testName">Test Name</Label>
        <Input
          id="testName"
          value={testName}
          onChange={(e) => setTestName(e.target.value)}
          placeholder="e.g., Morning Practice Test"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="testType">Test Type</Label>
          <Select value={testType} onValueChange={setTestType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="practice_test">Practice Test</SelectItem>
              <SelectItem value="mock_exam">Mock Exam</SelectItem>
              <SelectItem value="weakness_focus">Weakness Focus</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="questionCount">Number of Questions</Label>
          <Select value={questionCount.toString()} onValueChange={(value: string) => setQuestionCount(parseInt(value))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 questions</SelectItem>
              <SelectItem value="15">15 questions</SelectItem>
              <SelectItem value="20">20 questions</SelectItem>
              <SelectItem value="25">25 questions</SelectItem>
              <SelectItem value="30">30 questions</SelectItem>
              <SelectItem value="50">50 questions</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="difficultyLevel">Difficulty Level</Label>
        <Select value={difficultyLevel} onValueChange={setDifficultyLevel}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="easy">Easy</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="hard">Hard</SelectItem>
            <SelectItem value="mixed">Mixed (Recommended)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {practiceLists.length > 0 && (
        <div>
          <Label htmlFor="practiceList">Practice List (Optional)</Label>
          <Select value={practiceListId} onValueChange={setPracticeListId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a practice list..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">None - Use AI recommendations</SelectItem>
              {practiceLists.map((list) => (
                <SelectItem key={list.id} value={list.id}>
                  {list.name} ({list.item_count} items)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={generating}>
        {generating ? (
          <>
            <Brain className="mr-2 h-4 w-4 animate-spin" />
            Generating Test...
          </>
        ) : (
          <>
            <Target className="mr-2 h-4 w-4" />
            Generate Personalized Test
          </>
        )}
      </Button>
    </form>
  )
}
