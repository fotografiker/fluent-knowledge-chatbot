import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'en' | 'tr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Auth
    'auth.login': 'Login',
    'auth.register': 'Register',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.forgotPassword': 'Forgot Password?',
    'auth.signIn': 'Sign In',
    'auth.signUp': 'Sign Up',
    'auth.alreadyHaveAccount': 'Already have an account?',
    'auth.noAccount': "Don't have an account?",
    
    // Navigation
    'nav.chat': 'Chat',
    'nav.documents': 'Documents',
    'nav.users': 'Users',
    'nav.stats': 'Statistics',
    'nav.settings': 'Settings',
    'nav.logout': 'Logout',
    
    // Chat
    'chat.placeholder': 'Ask me anything about the documents...',
    'chat.send': 'Send',
    'chat.typing': 'AI is typing...',
    'chat.newChat': 'New Chat',
    'chat.history': 'Chat History',
    
    // Documents
    'docs.upload': 'Upload Documents',
    'docs.title': 'Document Management',
    'docs.dragDrop': 'Drag & drop your PDF files here, or click to browse',
    'docs.processing': 'Processing...',
    'docs.vectorizing': 'Vectorizing document...',
    
    // Settings
    'settings.title': 'Settings',
    'settings.apiKeys': 'API Keys',
    'settings.supabase': 'Supabase Configuration',
    'settings.embedding': 'Embedding API Key',
    'settings.llm': 'LLM API Key',
    'settings.systemPrompt': 'System Prompt',
    'settings.save': 'Save Settings',
    
    // Common
    'common.loading': 'Loading...',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.search': 'Search',
  },
  tr: {
    // Auth
    'auth.login': 'Giriş Yap',
    'auth.register': 'Kayıt Ol',
    'auth.email': 'E-posta',
    'auth.password': 'Şifre',
    'auth.confirmPassword': 'Şifre Onayı',
    'auth.forgotPassword': 'Şifremi Unuttum?',
    'auth.signIn': 'Giriş Yap',
    'auth.signUp': 'Kayıt Ol',
    'auth.alreadyHaveAccount': 'Zaten hesabınız var mı?',
    'auth.noAccount': 'Hesabınız yok mu?',
    
    // Navigation
    'nav.chat': 'Sohbet',
    'nav.documents': 'Belgeler',
    'nav.users': 'Kullanıcılar',
    'nav.stats': 'İstatistikler',
    'nav.settings': 'Ayarlar',
    'nav.logout': 'Çıkış Yap',
    
    // Chat
    'chat.placeholder': 'Belgeler hakkında herhangi bir şey sorun...',
    'chat.send': 'Gönder',
    'chat.typing': 'AI yazıyor...',
    'chat.newChat': 'Yeni Sohbet',
    'chat.history': 'Sohbet Geçmişi',
    
    // Documents
    'docs.upload': 'Belge Yükle',
    'docs.title': 'Belge Yönetimi',
    'docs.dragDrop': 'PDF dosyalarınızı buraya sürükleyip bırakın veya göz atmak için tıklayın',
    'docs.processing': 'İşleniyor...',
    'docs.vectorizing': 'Belge vektörleştiriliyor...',
    
    // Settings
    'settings.title': 'Ayarlar',
    'settings.apiKeys': 'API Anahtarları',
    'settings.supabase': 'Supabase Yapılandırması',
    'settings.embedding': 'Embedding API Anahtarı',
    'settings.llm': 'LLM API Anahtarı',
    'settings.systemPrompt': 'Sistem Komutu',
    'settings.save': 'Ayarları Kaydet',
    
    // Common
    'common.loading': 'Yükleniyor...',
    'common.save': 'Kaydet',
    'common.cancel': 'İptal',
    'common.delete': 'Sil',
    'common.edit': 'Düzenle',
    'common.search': 'Ara',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};