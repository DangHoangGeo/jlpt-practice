"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Save, 
  X,
  BookOpen,
  Star
} from "lucide-react";

interface UserVocabulary {
  id: string;
  term: string;
  reading: string;
  meaning_en: string;
  meaning_vi?: string;
  example_jp: string;
  example_en?: string;
  example_vi?: string;
  tags: string[];
  source?: string;
  is_public: boolean;
  created_at: string;
}

interface UserGrammar {
  id: string;
  pattern: string;
  reading: string;
  meaning_en: string;
  meaning_vi?: string;
  example_jp: string;
  example_en?: string;
  example_vi?: string;
  usage_notes?: string;
  tags: string[];
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  is_public: boolean;
  created_at: string;
}

interface VocabFormData {
  term: string;
  reading: string;
  meaning_en: string;
  meaning_vi: string;
  example_jp: string;
  example_en: string;
  example_vi: string;
  tags: string;
  source: string;
  is_public: boolean;
}

interface GrammarFormData {
  pattern: string;
  reading: string;
  meaning_en: string;
  meaning_vi: string;
  example_jp: string;
  example_en: string;
  example_vi: string;
  usage_notes: string;
  tags: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  is_public: boolean;
}

export default function UserContentPage() {
  const [userVocab, setUserVocab] = useState<UserVocabulary[]>([]);
  const [userGrammar, setUserGrammar] = useState<UserGrammar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showVocabForm, setShowVocabForm] = useState(false);
  const [showGrammarForm, setShowGrammarForm] = useState(false);
  const [editingVocab, setEditingVocab] = useState<string | null>(null);
  const [editingGrammar, setEditingGrammar] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [includePublic, setIncludePublic] = useState(false);

  const [vocabForm, setVocabForm] = useState<VocabFormData>({
    term: '',
    reading: '',
    meaning_en: '',
    meaning_vi: '',
    example_jp: '',
    example_en: '',
    example_vi: '',
    tags: '',
    source: '',
    is_public: false
  });

  const [grammarForm, setGrammarForm] = useState<GrammarFormData>({
    pattern: '',
    reading: '',
    meaning_en: '',
    meaning_vi: '',
    example_jp: '',
    example_en: '',
    example_vi: '',
    usage_notes: '',
    tags: '',
    difficulty_level: 'intermediate',
    is_public: false
  });

  useEffect(() => {
    fetchUserContent();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includePublic, searchTerm]);

  const fetchUserContent = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const searchParams = new URLSearchParams();
      if (includePublic) searchParams.set('include_public', 'true');
      if (searchTerm) searchParams.set('search', searchTerm);
      
      const [vocabResponse, grammarResponse] = await Promise.all([
        fetch(`/api/user-vocabulary?${searchParams.toString()}`),
        fetch(`/api/user-grammar?${searchParams.toString()}`)
      ]);

      if (vocabResponse.ok) {
        const vocabData = await vocabResponse.json();
        setUserVocab(vocabData.vocabulary || []);
      }

      if (grammarResponse.ok) {
        const grammarData = await grammarResponse.json();
        setUserGrammar(grammarData.grammar || []);
      }
    } catch (error) {
      console.error('Error fetching user content:', error);
    } finally {
      setIsLoading(false);
    }
  }, [includePublic, searchTerm]);

  const handleVocabSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload = {
        ...vocabForm,
        tags: vocabForm.tags.split(',').map(t => t.trim()).filter(Boolean)
      };

      const response = await fetch('/api/user-vocabulary', {
        method: editingVocab ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingVocab ? { id: editingVocab, ...payload } : payload)
      });

      if (response.ok) {
        await fetchUserContent();
        setShowVocabForm(false);
        setEditingVocab(null);
        setVocabForm({
          term: '', reading: '', meaning_en: '', meaning_vi: '',
          example_jp: '', example_en: '', example_vi: '',
          tags: '', source: '', is_public: false
        });
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save vocabulary');
      }
    } catch (error) {
      console.error('Error saving vocabulary:', error);
      alert('Failed to save vocabulary');
    }
  };

  const handleGrammarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload = {
        ...grammarForm,
        tags: grammarForm.tags.split(',').map(t => t.trim()).filter(Boolean)
      };

      const response = await fetch('/api/user-grammar', {
        method: editingGrammar ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingGrammar ? { id: editingGrammar, ...payload } : payload)
      });

      if (response.ok) {
        await fetchUserContent();
        setShowGrammarForm(false);
        setEditingGrammar(null);
        setGrammarForm({
          pattern: '', reading: '', meaning_en: '', meaning_vi: '',
          example_jp: '', example_en: '', example_vi: '', usage_notes: '',
          tags: '', difficulty_level: 'intermediate', is_public: false
        });
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save grammar');
      }
    } catch (error) {
      console.error('Error saving grammar:', error);
      alert('Failed to save grammar');
    }
  };

  const deleteVocab = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vocabulary entry?')) return;
    
    try {
      const response = await fetch(`/api/user-vocabulary?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchUserContent();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete vocabulary');
      }
    } catch (error) {
      console.error('Error deleting vocabulary:', error);
      alert('Failed to delete vocabulary');
    }
  };

  const deleteGrammar = async (id: string) => {
    if (!confirm('Are you sure you want to delete this grammar entry?')) return;
    
    try {
      const response = await fetch(`/api/user-grammar?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchUserContent();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete grammar');
      }
    } catch (error) {
      console.error('Error deleting grammar:', error);
      alert('Failed to delete grammar');
    }
  };

  const editVocab = (vocab: UserVocabulary) => {
    setVocabForm({
      term: vocab.term,
      reading: vocab.reading,
      meaning_en: vocab.meaning_en,
      meaning_vi: vocab.meaning_vi || '',
      example_jp: vocab.example_jp,
      example_en: vocab.example_en || '',
      example_vi: vocab.example_vi || '',
      tags: vocab.tags.join(', '),
      source: vocab.source || '',
      is_public: vocab.is_public
    });
    setEditingVocab(vocab.id);
    setShowVocabForm(true);
  };

  const editGrammar = (grammar: UserGrammar) => {
    setGrammarForm({
      pattern: grammar.pattern,
      reading: grammar.reading,
      meaning_en: grammar.meaning_en,
      meaning_vi: grammar.meaning_vi || '',
      example_jp: grammar.example_jp,
      example_en: grammar.example_en || '',
      example_vi: grammar.example_vi || '',
      usage_notes: grammar.usage_notes || '',
      tags: grammar.tags.join(', '),
      difficulty_level: grammar.difficulty_level,
      is_public: grammar.is_public
    });
    setEditingGrammar(grammar.id);
    setShowGrammarForm(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            My Learning Library
          </h1>
          <p className="text-lg text-gray-600">
            Add and manage your custom vocabulary and grammar entries
          </p>
        </div>

        {/* Search and Filter Controls */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search your content..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-public"
                  checked={includePublic}
                  onCheckedChange={(checked) => setIncludePublic(checked as boolean)}
                />
                <Label htmlFor="include-public" className="text-sm">
                  Include public content
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="vocabulary" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="vocabulary">Vocabulary ({userVocab.length})</TabsTrigger>
            <TabsTrigger value="grammar">Grammar ({userGrammar.length})</TabsTrigger>
          </TabsList>

          {/* Vocabulary Tab */}
          <TabsContent value="vocabulary" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Your Vocabulary</h2>
              <Button onClick={() => setShowVocabForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Vocabulary
              </Button>
            </div>

            {/* Vocabulary Form */}
            {showVocabForm && (
              <Card>
                <CardHeader>
                  <CardTitle>{editingVocab ? 'Edit' : 'Add'} Vocabulary</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleVocabSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="term">Japanese Term *</Label>
                        <Input
                          id="term"
                          value={vocabForm.term}
                          onChange={(e) => setVocabForm({...vocabForm, term: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="reading">Reading *</Label>
                        <Input
                          id="reading"
                          value={vocabForm.reading}
                          onChange={(e) => setVocabForm({...vocabForm, reading: e.target.value})}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="meaning_en">English Meaning *</Label>
                        <Input
                          id="meaning_en"
                          value={vocabForm.meaning_en}
                          onChange={(e) => setVocabForm({...vocabForm, meaning_en: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="meaning_vi">Vietnamese Meaning</Label>
                        <Input
                          id="meaning_vi"
                          value={vocabForm.meaning_vi}
                          onChange={(e) => setVocabForm({...vocabForm, meaning_vi: e.target.value})}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="example_jp">Japanese Example *</Label>
                      <Input
                        id="example_jp"
                        value={vocabForm.example_jp}
                        onChange={(e) => setVocabForm({...vocabForm, example_jp: e.target.value})}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="example_en">English Example</Label>
                        <Input
                          id="example_en"
                          value={vocabForm.example_en}
                          onChange={(e) => setVocabForm({...vocabForm, example_en: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="example_vi">Vietnamese Example</Label>
                        <Input
                          id="example_vi"
                          value={vocabForm.example_vi}
                          onChange={(e) => setVocabForm({...vocabForm, example_vi: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="tags">Tags (comma separated)</Label>
                        <Input
                          id="tags"
                          value={vocabForm.tags}
                          onChange={(e) => setVocabForm({...vocabForm, tags: e.target.value})}
                          placeholder="business, formal, common"
                        />
                      </div>
                      <div>
                        <Label htmlFor="source">Source</Label>
                        <Input
                          id="source"
                          value={vocabForm.source}
                          onChange={(e) => setVocabForm({...vocabForm, source: e.target.value})}
                          placeholder="Where did you find this word?"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="is_public_vocab"
                        checked={vocabForm.is_public}
                        onCheckedChange={(checked) => setVocabForm({...vocabForm, is_public: checked as boolean})}
                      />
                      <Label htmlFor="is_public_vocab" className="text-sm">
                        Make this public for other users
                      </Label>
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit">
                        <Save className="h-4 w-4 mr-2" />
                        {editingVocab ? 'Update' : 'Save'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setShowVocabForm(false);
                          setEditingVocab(null);
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Vocabulary List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userVocab.map((vocab) => (
                <Card key={vocab.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg font-japanese">{vocab.term}</CardTitle>
                        <CardDescription>{vocab.reading}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => editVocab(vocab)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteVocab(vocab.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm">{vocab.meaning_en}</p>
                    {vocab.meaning_vi && (
                      <p className="text-sm text-muted-foreground">{vocab.meaning_vi}</p>
                    )}
                    <p className="text-sm font-japanese italic">{vocab.example_jp}</p>
                    {vocab.example_en && (
                      <p className="text-xs text-muted-foreground">{vocab.example_en}</p>
                    )}
                    
                    <div className="flex flex-wrap gap-1 mt-2">
                      {vocab.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {vocab.is_public && (
                        <Badge variant="outline" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Public
                        </Badge>
                      )}
                    </div>
                    
                    {vocab.source && (
                      <p className="text-xs text-muted-foreground">
                        Source: {vocab.source}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
              
              {userVocab.length === 0 && !isLoading && (
                <div className="col-span-full text-center py-8">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No vocabulary entries yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start building your personal vocabulary collection
                  </p>
                  <Button onClick={() => setShowVocabForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Word
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Grammar Tab - Similar structure to vocabulary */}
          <TabsContent value="grammar" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Your Grammar</h2>
              <Button onClick={() => setShowGrammarForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Grammar
              </Button>
            </div>

            {/* Grammar Form */}
            {showGrammarForm && (
              <Card>
                <CardHeader>
                  <CardTitle>{editingGrammar ? 'Edit' : 'Add'} Grammar Pattern</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleGrammarSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="pattern">Grammar Pattern *</Label>
                        <Input
                          id="pattern"
                          value={grammarForm.pattern}
                          onChange={(e) => setGrammarForm({...grammarForm, pattern: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="reading">Reading *</Label>
                        <Input
                          id="reading"
                          value={grammarForm.reading}
                          onChange={(e) => setGrammarForm({...grammarForm, reading: e.target.value})}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="meaning_en">English Meaning *</Label>
                        <Input
                          id="meaning_en"
                          value={grammarForm.meaning_en}
                          onChange={(e) => setGrammarForm({...grammarForm, meaning_en: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="meaning_vi">Vietnamese Meaning</Label>
                        <Input
                          id="meaning_vi"
                          value={grammarForm.meaning_vi}
                          onChange={(e) => setGrammarForm({...grammarForm, meaning_vi: e.target.value})}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="example_jp">Japanese Example *</Label>
                      <Input
                        id="example_jp"
                        value={grammarForm.example_jp}
                        onChange={(e) => setGrammarForm({...grammarForm, example_jp: e.target.value})}
                        required
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit">
                        <Save className="h-4 w-4 mr-2" />
                        {editingGrammar ? 'Update' : 'Save'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setShowGrammarForm(false);
                          setEditingGrammar(null);
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Grammar List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userGrammar.map((grammar) => (
                <Card key={grammar.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg font-japanese">{grammar.pattern}</CardTitle>
                        <CardDescription>{grammar.reading}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => editGrammar(grammar)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteGrammar(grammar.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm">{grammar.meaning_en}</p>
                    {grammar.meaning_vi && (
                      <p className="text-sm text-muted-foreground">{grammar.meaning_vi}</p>
                    )}
                    <p className="text-sm font-japanese italic">{grammar.example_jp}</p>
                    
                    <div className="flex flex-wrap gap-1 mt-2">
                      {grammar.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {grammar.is_public && (
                        <Badge variant="outline" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Public
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {userGrammar.length === 0 && !isLoading && (
                <div className="col-span-full text-center py-8">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No grammar entries yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start building your personal grammar collection
                  </p>
                  <Button onClick={() => setShowGrammarForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Pattern
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
