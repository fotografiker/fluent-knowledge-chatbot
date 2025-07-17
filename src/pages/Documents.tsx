import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Upload, 
  FileText, 
  Trash2, 
  Download, 
  Eye, 
  AlertCircle,
  CheckCircle,
  Clock,
  Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Document {
  id: string;
  name: string;
  size: string;
  uploadedAt: Date;
  status: 'processing' | 'completed' | 'failed';
  progress?: number;
  chunks?: number;
  error?: string;
}

const Documents: React.FC = () => {
  const { t } = useLanguage();
  const [documents] = useState<Document[]>([
    {
      id: '1',
      name: 'Company_Policy_2024.pdf',
      size: '2.4 MB',
      uploadedAt: new Date('2024-01-15'),
      status: 'completed',
      chunks: 127,
    },
    {
      id: '2',
      name: 'Technical_Manual_v2.pdf',
      size: '5.8 MB',
      uploadedAt: new Date('2024-01-14'),
      status: 'processing',
      progress: 65,
    },
    {
      id: '3',
      name: 'User_Guidelines.pdf',
      size: '1.2 MB',
      uploadedAt: new Date('2024-01-13'),
      status: 'completed',
      chunks: 89,
    },
    {
      id: '4',
      name: 'API_Documentation.pdf',
      size: '3.1 MB',
      uploadedAt: new Date('2024-01-12'),
      status: 'failed',
      error: 'Unsupported format detected',
    },
  ]);

  const [dragActive, setDragActive] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      // Handle file upload
      console.log('Files dropped:', e.dataTransfer.files);
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status: Document['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: Document['status']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-50 text-green-700">Completed</Badge>;
      case 'processing':
        return <Badge variant="secondary">Processing</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('docs.title')}</h1>
        <p className="text-muted-foreground">
          Upload and manage your PDF documents for the AI knowledge base
        </p>
      </div>

      {/* Upload Area */}
      <Card className="mb-8 border-primary/20">
        <CardContent className="p-6">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50 hover:bg-accent/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('docs.upload')}</h3>
            <p className="text-muted-foreground mb-4">
              {t('docs.dragDrop')}
            </p>
            <Button className="bg-gradient-primary text-white">
              Browse Files
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              Supported formats: PDF (max 10MB)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">All</Button>
            <Button variant="outline" size="sm">Completed</Button>
            <Button variant="outline" size="sm">Processing</Button>
            <Button variant="outline" size="sm">Failed</Button>
          </div>
        </div>
      </div>

      {/* Documents List */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Documents ({filteredDocuments.length})</CardTitle>
          <CardDescription>
            Manage your uploaded documents and their processing status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-sm truncate">{doc.name}</h3>
                      {getStatusIcon(doc.status)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{doc.size}</span>
                      <span>{doc.uploadedAt.toLocaleDateString()}</span>
                      {doc.chunks && <span>{doc.chunks} chunks</span>}
                    </div>
                    
                    {doc.status === 'processing' && doc.progress && (
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>{t('docs.vectorizing')}</span>
                          <span>{doc.progress}%</span>
                        </div>
                        <Progress value={doc.progress} className="h-1" />
                      </div>
                    )}
                    
                    {doc.status === 'failed' && doc.error && (
                      <div className="mt-1 text-xs text-red-600">
                        Error: {doc.error}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getStatusBadge(doc.status)}
                  
                  <div className="flex gap-1 ml-4">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Processing Info */}
      {documents.some(doc => doc.status === 'processing') && (
        <Card className="mt-6 border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <h4 className="font-medium text-blue-900">Processing in Progress</h4>
                <p className="text-sm text-blue-700">
                  Documents are being vectorized and indexed. This may take a few minutes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Documents;