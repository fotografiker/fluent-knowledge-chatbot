import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Key, 
  Database, 
  Brain, 
  MessageSquare, 
  Save, 
  TestTube,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react';

const Settings: React.FC = () => {
  const { t } = useLanguage();
  
  // API Keys State
  const [showKeys, setShowKeys] = useState({
    supabase: false,
    embedding: false,
    llm: false,
  });
  
  const [apiKeys, setApiKeys] = useState({
    supabaseUrl: '',
    supabaseKey: '',
    embeddingApiKey: '',
    llmApiKey: '',
    llmProvider: 'openai',
  });

  const [systemPrompt, setSystemPrompt] = useState(
    `You are an AI assistant that helps users find information from uploaded documents. 

Guidelines:
- Only answer questions based on the provided document context
- If information is not available in the documents, clearly state this
- Provide specific references to document sections when possible
- Be helpful and concise in your responses
- If asked about topics outside the document scope, politely redirect to document-related questions

Always maintain accuracy and cite your sources from the uploaded documents.`
  );

  const [testResults, setTestResults] = useState({
    supabase: null as boolean | null,
    embedding: null as boolean | null,
    llm: null as boolean | null,
  });

  const handleSaveSettings = () => {
    // TODO: Save to Supabase or localStorage
    console.log('Saving settings:', { apiKeys, systemPrompt });
  };

  const testConnection = async (service: keyof typeof testResults) => {
    setTestResults(prev => ({ ...prev, [service]: null }));
    
    // Simulate API test
    setTimeout(() => {
      const success = Math.random() > 0.3; // 70% success rate for demo
      setTestResults(prev => ({ 
        ...prev, 
        [service]: success
      }));
    }, 2000);
  };

  const toggleKeyVisibility = (keyType: keyof typeof showKeys) => {
    setShowKeys(prev => ({ ...prev, [keyType]: !prev[keyType] }));
  };

  const renderConnectionStatus = (status: boolean | null) => {
    if (status === null) return <Badge variant="secondary">Not tested</Badge>;
    if (status === true) return <Badge className="bg-green-50 text-green-700">Connected</Badge>;
    return <Badge variant="destructive">Failed</Badge>;
  };

  const renderTestButton = (service: keyof typeof testResults) => {
    const isLoading = false; // For now, no loading state
    
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => testConnection(service)}
        disabled={isLoading}
        className="gap-2"
      >
        <TestTube className="h-4 w-4" />
        {isLoading ? 'Testing...' : 'Test'}
      </Button>
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('settings.title')}</h1>
        <p className="text-muted-foreground">
          Configure your AI assistant's API connections and behavior
        </p>
      </div>

      <Tabs defaultValue="api-keys" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="api-keys" className="gap-2">
            <Key className="h-4 w-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="system-prompt" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            System Prompt
          </TabsTrigger>
          <TabsTrigger value="advanced" className="gap-2">
            <Brain className="h-4 w-4" />
            Advanced
          </TabsTrigger>
        </TabsList>

        {/* API Keys Tab */}
        <TabsContent value="api-keys" className="space-y-6">
          {/* Supabase Configuration */}
          <Card className="border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-green-600" />
                  <CardTitle>Supabase Configuration</CardTitle>
                </div>
                {renderConnectionStatus(testResults.supabase)}
              </div>
              <CardDescription>
                Configure your Supabase database for user management and document storage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="supabaseUrl">Supabase URL</Label>
                <Input
                  id="supabaseUrl"
                  placeholder="https://your-project.supabase.co"
                  value={apiKeys.supabaseUrl}
                  onChange={(e) => setApiKeys(prev => ({ ...prev, supabaseUrl: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="supabaseKey">Supabase Anon Key</Label>
                <div className="relative">
                  <Input
                    id="supabaseKey"
                    type={showKeys.supabase ? 'text' : 'password'}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={apiKeys.supabaseKey}
                    onChange={(e) => setApiKeys(prev => ({ ...prev, supabaseKey: e.target.value }))}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-8 w-8 p-0"
                    onClick={() => toggleKeyVisibility('supabase')}
                  >
                    {showKeys.supabase ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-end">
                {renderTestButton('supabase')}
              </div>
            </CardContent>
          </Card>

          {/* Embedding API */}
          <Card className="border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-blue-600" />
                  <CardTitle>Embedding API</CardTitle>
                </div>
                {renderConnectionStatus(testResults.embedding)}
              </div>
              <CardDescription>
                Configure the embedding service for document vectorization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="embeddingProvider">Embedding Provider</Label>
                <Select defaultValue="openai">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI Embeddings</SelectItem>
                    <SelectItem value="huggingface">Hugging Face</SelectItem>
                    <SelectItem value="cohere">Cohere</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="embeddingApiKey">API Key</Label>
                <div className="relative">
                  <Input
                    id="embeddingApiKey"
                    type={showKeys.embedding ? 'text' : 'password'}
                    placeholder="sk-..."
                    value={apiKeys.embeddingApiKey}
                    onChange={(e) => setApiKeys(prev => ({ ...prev, embeddingApiKey: e.target.value }))}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-8 w-8 p-0"
                    onClick={() => toggleKeyVisibility('embedding')}
                  >
                    {showKeys.embedding ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-end">
                {renderTestButton('embedding')}
              </div>
            </CardContent>
          </Card>

          {/* LLM API */}
          <Card className="border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-purple-600" />
                  <CardTitle>LLM API</CardTitle>
                </div>
                {renderConnectionStatus(testResults.llm)}
              </div>
              <CardDescription>
                Configure the language model for generating responses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="llmProvider">LLM Provider</Label>
                <Select 
                  value={apiKeys.llmProvider} 
                  onValueChange={(value) => setApiKeys(prev => ({ ...prev, llmProvider: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI GPT</SelectItem>
                    <SelectItem value="anthropic">Anthropic Claude</SelectItem>
                    <SelectItem value="google">Google Gemini</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="llmApiKey">API Key</Label>
                <div className="relative">
                  <Input
                    id="llmApiKey"
                    type={showKeys.llm ? 'text' : 'password'}
                    placeholder={
                      apiKeys.llmProvider === 'openai' ? 'sk-...' :
                      apiKeys.llmProvider === 'anthropic' ? 'sk-ant-...' :
                      'AIza...'
                    }
                    value={apiKeys.llmApiKey}
                    onChange={(e) => setApiKeys(prev => ({ ...prev, llmApiKey: e.target.value }))}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-8 w-8 p-0"
                    onClick={() => toggleKeyVisibility('llm')}
                  >
                    {showKeys.llm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-end">
                {renderTestButton('llm')}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Prompt Tab */}
        <TabsContent value="system-prompt" className="space-y-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>System Prompt Configuration</CardTitle>
              <CardDescription>
                Define how your AI assistant should behave and respond to user queries
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="systemPrompt">System Prompt</Label>
                <Textarea
                  id="systemPrompt"
                  placeholder="Enter your system prompt here..."
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="min-h-[200px] resize-none"
                />
                <p className="text-sm text-muted-foreground">
                  This prompt will be used to instruct the AI on how to behave and respond to user queries.
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline">Reset to Default</Button>
                <Button variant="outline">Test Prompt</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>
                Advanced configuration options for fine-tuning your AI assistant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="chunkSize">Chunk Size</Label>
                  <Input
                    id="chunkSize"
                    type="number"
                    placeholder="1000"
                    defaultValue="1000"
                  />
                  <p className="text-xs text-muted-foreground">
                    Size of text chunks for vectorization
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="chunkOverlap">Chunk Overlap</Label>
                  <Input
                    id="chunkOverlap"
                    type="number"
                    placeholder="200"
                    defaultValue="200"
                  />
                  <p className="text-xs text-muted-foreground">
                    Overlap between consecutive chunks
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxTokens">Max Response Tokens</Label>
                  <Input
                    id="maxTokens"
                    type="number"
                    placeholder="500"
                    defaultValue="500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature</Label>
                  <Input
                    id="temperature"
                    type="number"
                    placeholder="0.7"
                    defaultValue="0.7"
                    step="0.1"
                    min="0"
                    max="2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end pt-6">
        <Button onClick={handleSaveSettings} className="gap-2 bg-gradient-primary text-white">
          <Save className="h-4 w-4" />
          {t('settings.save')}
        </Button>
      </div>
    </div>
  );
};

export default Settings;