import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Users, 
  BarChart3, 
  Settings, 
  Upload, 
  Bot,
  LogOut,
  MessageSquare,
  Database,
  Zap
} from 'lucide-react';

const Admin: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const stats = [
    {
      title: 'Total Documents',
      value: '24',
      change: '+12%',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Active Users',
      value: '156',
      change: '+8%',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Chat Sessions',
      value: '1,247',
      change: '+23%',
      icon: MessageSquare,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Vectorized Chunks',
      value: '8,934',
      change: '+45%',
      icon: Database,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  const recentDocuments = [
    { name: 'Company_Policy_2024.pdf', status: 'Processed', uploadedAt: '2 hours ago' },
    { name: 'Technical_Manual_v2.pdf', status: 'Processing', uploadedAt: '4 hours ago' },
    { name: 'User_Guidelines.pdf', status: 'Processed', uploadedAt: '1 day ago' },
    { name: 'API_Documentation.pdf', status: 'Failed', uploadedAt: '2 days ago' },
  ];

  const navigationItems = [
    { icon: FileText, label: t('nav.documents'), active: false },
    { icon: Users, label: t('nav.users'), active: false },
    { icon: BarChart3, label: t('nav.stats'), active: true },
    { icon: Settings, label: t('nav.settings'), active: false },
  ];

  return (
    <div className="min-h-screen bg-gradient-admin">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">AI Knowledge Assistant</h1>
              <p className="text-sm text-muted-foreground">Admin Dashboard</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <LanguageToggle />
            <Button variant="outline" size="sm" className="gap-2">
              <LogOut className="h-4 w-4" />
              {t('nav.logout')}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-card border-r border-border min-h-screen">
          <nav className="p-4">
            <div className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.label}
                    variant={item.active ? 'default' : 'ghost'}
                    className={`w-full justify-start gap-3 ${
                      item.active ? 'bg-gradient-primary text-white' : ''
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                );
              })}
            </div>

            <div className="mt-8 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Quick Actions</span>
              </div>
              <div className="space-y-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full justify-start gap-2"
                    onClick={() => navigate('/admin/documents')}
                  >
                    <Upload className="h-3 w-3" />
                    {t('docs.upload')}
                  </Button>
                <Button size="sm" variant="outline" className="w-full justify-start gap-2">
                  <MessageSquare className="h-3 w-3" />
                  {t('nav.chat')}
                </Button>
              </div>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.title} className="border-primary/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <Badge 
                          variant="secondary" 
                          className="text-xs bg-green-50 text-green-700 mt-2"
                        >
                          {stat.change}
                        </Badge>
                      </div>
                      <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                        <Icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Recent Documents */}
          <Card className="mb-8 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recent Documents
              </CardTitle>
              <CardDescription>
                Latest document uploads and their processing status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentDocuments.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">{doc.uploadedAt}</p>
                      </div>
                    </div>
                    <Badge 
                      variant={
                        doc.status === 'Processed' ? 'default' : 
                        doc.status === 'Processing' ? 'secondary' : 
                        'destructive'
                      }
                    >
                      {doc.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Current system health and performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Database Connection</span>
                    <Badge variant="default" className="bg-green-500">Healthy</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Vector Store</span>
                    <Badge variant="default" className="bg-green-500">Online</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">LLM API</span>
                    <Badge variant="secondary">Configured</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Embedding API</span>
                    <Badge variant="secondary">Configured</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common administrative tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button 
                    className="w-full justify-start gap-2 bg-gradient-primary text-white"
                    onClick={() => navigate('/admin/documents')}
                  >
                    <Upload className="h-4 w-4" />
                    Upload New Documents
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Settings className="h-4 w-4" />
                    Configure APIs
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Users className="h-4 w-4" />
                    Manage Users
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <BarChart3 className="h-4 w-4" />
                    View Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Admin;