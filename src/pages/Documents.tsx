import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  FileText, 
  Trash2, 
  Download, 
  Eye, 
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  ArrowLeft
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';

interface Document {
  id: string;
  title: string;
  filename: string;
  file_size: number;
  created_at: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  chunk_count?: number;
  processing_error?: string;
}

const Documents: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication first
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      fetchDocuments();
    };

    checkAuth();
    
    // Poll for status updates
    const interval = setInterval(fetchDocuments, 5000);
    return () => clearInterval(interval);
  }, [navigate]);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch documents',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

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
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  const uploadFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      toast({
        title: 'Invalid file type',
        description: 'Only PDF files are supported',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'File size must be less than 10MB',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Session check:', session ? 'Session found' : 'No session', session?.access_token ? 'Token exists' : 'No token');
      if (!session) {
        throw new Error('Authentication required');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name);

      const response = await supabase.functions.invoke('upload-document', {
        body: formData,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw response.error;
      }

      toast({
        title: 'Upload successful',
        description: 'Document uploaded and processing started',
      });

      // Refresh the documents list
      fetchDocuments();
      
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload document',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const deleteDocument = async (documentId: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      toast({
        title: 'Document deleted',
        description: 'Document has been removed',
      });

      fetchDocuments();
    } catch (error: any) {
      toast({
        title: 'Delete failed',
        description: error.message || 'Failed to delete document',
        variant: 'destructive',
      });
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status: Document['processing_status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
      case 'pending':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: Document['processing_status']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-50 text-green-700">Completed</Badge>;
      case 'processing':
        return <Badge variant="secondary">Processing</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2 animate-spin" />
            <p className="text-muted-foreground">Loading documents...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin
          </Button>
        </div>
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
            <Button 
              className="bg-gradient-primary text-white"
              onClick={handleFileSelect}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Browse Files'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
            />
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
                      <h3 className="font-medium text-sm truncate">{doc.title}</h3>
                      {getStatusIcon(doc.processing_status)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{formatFileSize(doc.file_size)}</span>
                      <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                      {doc.chunk_count && <span>{doc.chunk_count} chunks</span>}
                    </div>
                    
                    {(doc.processing_status === 'processing' || doc.processing_status === 'pending') && (
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>{doc.processing_status === 'pending' ? 'Queued for processing' : 'Processing document'}</span>
                        </div>
                        <Progress value={doc.processing_status === 'pending' ? 0 : 50} className="h-1" />
                      </div>
                    )}
                    
                    {doc.processing_status === 'failed' && doc.processing_error && (
                      <div className="mt-1 text-xs text-red-600">
                        Error: {doc.processing_error}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getStatusBadge(doc.processing_status)}
                  
                  <div className="flex gap-1 ml-4">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => deleteDocument(doc.id)}
                    >
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
      {documents.some(doc => doc.processing_status === 'processing' || doc.processing_status === 'pending') && (
        <Card className="mt-6 border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <h4 className="font-medium text-blue-900">Processing in Progress</h4>
                <p className="text-sm text-blue-700">
                  Documents are being processed and chunked. This may take a few minutes.
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