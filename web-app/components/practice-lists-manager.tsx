'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2, Plus, BookOpen, Brain, Target, Star } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface PracticeList {
  id: string
  name: string
  description?: string
  is_active: boolean
  item_count: number
  created_at: string
  updated_at: string
}

interface PracticeListItem {
  id: string
  item_id: string
  item_type: 'vocab' | 'grammar'
  priority: number
  added_at: string
  vocabulary_items?: {
    id: string
    term: string
    reading: string
    meaning_en: string
    meaning_vi?: string
    example_jp: string
    section: string
  }
  grammar_items?: {
    id: string
    term: string
    reading: string
    meaning_en: string
    meaning_vi?: string
    example_jp: string
    section: string
  }
}

interface VocabItem {
  id: string
  term: string
  reading: string
  meaning_en: string
  meaning_vi?: string
  example_jp: string
  section: string
}

interface GrammarItem {
  id: string
  term: string
  reading: string
  meaning_en: string
  meaning_vi?: string
  example_jp: string
  section: string
}

export default function PracticeListsManager() {
  const [practiceLists, setPracticeLists] = useState<PracticeList[]>([])
  const [selectedList, setSelectedList] = useState<PracticeList | null>(null)
  const [listItems, setListItems] = useState<PracticeListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<(VocabItem | GrammarItem)[]>([])
  const [searchType, setSearchType] = useState<'vocab' | 'grammar'>('vocab')
  const { toast } = useToast()

  useEffect(() => {
    fetchPracticeLists()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPracticeLists = async () => {
    try {
      const response = await fetch('/api/practice-lists')
      if (response.ok) {
        const data = await response.json()
        setPracticeLists(data.lists)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch practice lists",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error fetching practice lists:', error)
      toast({
        title: "Error",
        description: "An error occurred while fetching practice lists",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchListItems = async (listId: string) => {
    try {
      const response = await fetch(`/api/practice-lists?list_id=${listId}&include_items=true`)
      if (response.ok) {
        const data = await response.json()
        setListItems(data.list.items)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch list items",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error fetching list items:', error)
    }
  }

  const createPracticeList = async (name: string, description: string) => {
    try {
      const response = await fetch('/api/practice-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Practice list created successfully"
        })
        fetchPracticeLists()
        setIsCreateDialogOpen(false)
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to create practice list",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error creating practice list:', error)
      toast({
        title: "Error",
        description: "An error occurred while creating the practice list",
        variant: "destructive"
      })
    }
  }

  const deletePracticeList = async (listId: string) => {
    try {
      const response = await fetch(`/api/practice-lists?list_id=${listId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Practice list deleted successfully"
        })
        fetchPracticeLists()
        if (selectedList?.id === listId) {
          setSelectedList(null)
          setListItems([])
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to delete practice list",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error deleting practice list:', error)
    }
  }

  const searchItems = async (query: string, type: 'vocab' | 'grammar') => {
    if (!query.trim()) return

    try {
      const endpoint = type === 'vocab' ? '/api/items/vocabulary' : '/api/items/grammar'
      const response = await fetch(`${endpoint}?search=${encodeURIComponent(query)}`)
      
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.items || [])
      } else {
        toast({
          title: "Error",
          description: "Failed to search items",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error searching items:', error)
    }
  }

  const addItemToList = async (item: VocabItem | GrammarItem, priority: number = 3) => {
    if (!selectedList) return

    try {
      const response = await fetch('/api/practice-lists', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          list_id: selectedList.id,
          add_items: [{
            item_id: item.id,
            item_type: searchType,
            priority
          }]
        })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Item added to practice list"
        })
        fetchListItems(selectedList.id)
        setIsAddItemDialogOpen(false)
        setSearchQuery('')
        setSearchResults([])
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to add item to list",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error adding item to list:', error)
    }
  }

  const removeItemFromList = async (itemId: string, itemType: 'vocab' | 'grammar') => {
    if (!selectedList) return

    try {
      const response = await fetch('/api/practice-lists', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          list_id: selectedList.id,
          remove_items: [{
            item_id: itemId,
            item_type: itemType
          }]
        })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Item removed from practice list"
        })
        fetchListItems(selectedList.id)
      } else {
        toast({
          title: "Error",
          description: "Failed to remove item from list",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error removing item from list:', error)
    }
  }

  const generateTestFromList = async () => {
    if (!selectedList) return

    try {
      const response = await fetch('/api/personalized-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          test_name: `Practice Test: ${selectedList.name}`,
          test_type: 'practice_test',
          question_count: Math.min(listItems.length, 20),
          practice_list_id: selectedList.id,
          focus_areas: ['practice_list']
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Success",
          description: "Personalized test generated successfully!"
        })
        // You could redirect to the test page here
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
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Practice Lists</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create List
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Practice List</DialogTitle>
              <DialogDescription>
                Create a curated list of vocabulary and grammar items to focus your study.
              </DialogDescription>
            </DialogHeader>
            <CreateListForm onSubmit={createPracticeList} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Practice Lists */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Your Practice Lists</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {practiceLists.map((list) => (
                  <div
                    key={list.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedList?.id === list.id
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => {
                      setSelectedList(list)
                      fetchListItems(list.id)
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{list.name}</h3>
                        <p className="text-sm text-gray-600">{list.item_count} items</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          deletePracticeList(list.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {practiceLists.length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    No practice lists yet. Create your first one!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* List Details */}
        <div className="lg:col-span-2">
          {selectedList ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{selectedList.name}</CardTitle>
                    <CardDescription>{selectedList.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Dialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Item
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Add Item to Practice List</DialogTitle>
                        </DialogHeader>
                        <AddItemForm
                          searchQuery={searchQuery}
                          setSearchQuery={setSearchQuery}
                          searchType={searchType}
                          setSearchType={setSearchType}
                          searchResults={searchResults}
                          onSearch={searchItems}
                          onAdd={addItemToList}
                        />
                      </DialogContent>
                    </Dialog>
                    <Button onClick={generateTestFromList} disabled={listItems.length === 0}>
                      <Target className="mr-2 h-4 w-4" />
                      Generate Test
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {listItems.map((item) => {
                    const itemData = item.vocabulary_items || item.grammar_items
                    if (!itemData) return null

                    return (
                      <div key={item.id} className="flex justify-between items-start p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={item.item_type === 'vocab' ? 'default' : 'secondary'}>
                              {item.item_type === 'vocab' ? <BookOpen className="mr-1 h-3 w-3" /> : <Brain className="mr-1 h-3 w-3" />}
                              {item.item_type}
                            </Badge>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${
                                    i < item.priority ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <h4 className="font-medium">{itemData.term}</h4>
                          <p className="text-sm text-gray-600">{itemData.reading}</p>
                          <p className="text-sm">{itemData.meaning_en}</p>
                          <p className="text-xs text-gray-500 mt-1">{itemData.example_jp}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItemFromList(item.item_id, item.item_type)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  })}
                  {listItems.length === 0 && (
                    <p className="text-gray-500 text-center py-8">
                      This practice list is empty. Add some items to get started!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <p className="text-gray-500">Select a practice list to view its contents</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function CreateListForm({ onSubmit }: { onSubmit: (name: string, description: string) => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onSubmit(name, description)
      setName('')
      setDescription('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Difficult Kanji, N3 Grammar"
          required
        />
      </div>
      <div>
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
          placeholder="Describe what this practice list is for..."
        />
      </div>
      <Button type="submit" className="w-full">Create Practice List</Button>
    </form>
  )
}

function AddItemForm({
  searchQuery,
  setSearchQuery,
  searchType,
  setSearchType,
  searchResults,
  onSearch,
  onAdd
}: {
  searchQuery: string
  setSearchQuery: (query: string) => void
  searchType: 'vocab' | 'grammar'
  setSearchType: (type: 'vocab' | 'grammar') => void
  searchResults: (VocabItem | GrammarItem)[]
  onSearch: (query: string, type: 'vocab' | 'grammar') => void
  onAdd: (item: VocabItem | GrammarItem, priority: number) => void
}) {
  const [selectedPriority, setSelectedPriority] = useState(3)

  const handleSearch = () => {
    if (searchQuery.trim()) {
      onSearch(searchQuery, searchType)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Select value={searchType} onValueChange={(value: 'vocab' | 'grammar') => setSearchType(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="vocab">Vocabulary</SelectItem>
            <SelectItem value="grammar">Grammar</SelectItem>
          </SelectContent>
        </Select>
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for items..."
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button onClick={handleSearch}>Search</Button>
      </div>

      <div>
        <Label>Priority Level</Label>
        <Select value={selectedPriority.toString()} onValueChange={(value: string) => setSelectedPriority(parseInt(value))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Low Priority</SelectItem>
            <SelectItem value="2">Below Average</SelectItem>
            <SelectItem value="3">Average</SelectItem>
            <SelectItem value="4">High Priority</SelectItem>
            <SelectItem value="5">Very High Priority</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="max-h-64 overflow-y-auto space-y-2">
        {searchResults.map((item) => (
          <div key={item.id} className="flex justify-between items-start p-3 border rounded-lg">
            <div className="flex-1">
              <h4 className="font-medium">{item.term}</h4>
              <p className="text-sm text-gray-600">{item.reading}</p>
              <p className="text-sm">{item.meaning_en}</p>
            </div>
            <Button
              size="sm"
              onClick={() => onAdd(item, selectedPriority)}
            >
              Add
            </Button>
          </div>
        ))}
        {searchQuery && searchResults.length === 0 && (
          <p className="text-gray-500 text-center py-4">No results found</p>
        )}
      </div>
    </div>
  )
}
