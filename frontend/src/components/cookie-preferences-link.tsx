'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useCookieConsent, type CookieConsent } from '@/hooks/use-cookie-consent';
import { Settings, Shield, BarChart3, Target, Cookie } from 'lucide-react';

interface CookiePreferencesLinkProps {
  variant?: 'link' | 'button';
  className?: string;
}

export function CookiePreferencesLink({ variant = 'link', className }: CookiePreferencesLinkProps) {
  const { getConsent, acceptCustom } = useCookieConsent();
  const [showDialog, setShowDialog] = useState(false);
  const [currentConsent, setCurrentConsent] = useState<CookieConsent>(getConsent());

  const handleSave = () => {
    acceptCustom(currentConsent);
    setShowDialog(false);
  };

  const cookieCategories = [
    {
      key: 'necessary' as const,
      title: 'Necessary Cookies',
      description: 'These cookies are essential for the website to function properly. They cannot be disabled.',
      icon: Shield,
      required: true,
    },
    {
      key: 'analytics' as const,
      title: 'Analytics Cookies',
      description: 'These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.',
      icon: BarChart3,
      required: false,
    },
    {
      key: 'marketing' as const,
      title: 'Marketing Cookies',
      description: 'These cookies are used to track visitors across websites to display relevant and engaging advertisements.',
      icon: Target,
      required: false,
    },
    {
      key: 'preferences' as const,
      title: 'Preference Cookies',
      description: 'These cookies allow the website to remember choices you make and provide enhanced, more personal features.',
      icon: Settings,
      required: false,
    },
  ];

  if (variant === 'button') {
    return (
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className={className}>
            <Cookie className="h-4 w-4 mr-2" />
            Cookie Preferences
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cookie className="h-5 w-5" />
              Cookie Preferences
            </DialogTitle>
            <DialogDescription>
              Manage your cookie preferences. You can change these settings at any time.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {cookieCategories.map((category) => {
              const IconComponent = category.icon;
              return (
                <div key={category.key} className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <IconComponent className="h-5 w-5 mt-0.5 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{category.title}</h4>
                          {category.required && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                              Required
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {category.description}
                        </p>
                      </div>
                    </div>
                    
                    <Switch
                      checked={currentConsent[category.key]}
                      onCheckedChange={(checked) => 
                        setCurrentConsent(prev => ({ ...prev, [category.key]: checked }))
                      }
                      disabled={category.required}
                    />
                  </div>
                  {category.key !== 'preferences' && <Separator />}
                </div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowDialog(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Save Preferences
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <button 
          className={`text-sm text-muted-foreground hover:text-foreground transition-colors ${className}`}
          onClick={() => setCurrentConsent(getConsent())}
        >
          Cookie Preferences
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cookie className="h-5 w-5" />
            Cookie Preferences
          </DialogTitle>
          <DialogDescription>
            Manage your cookie preferences. You can change these settings at any time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {cookieCategories.map((category) => {
            const IconComponent = category.icon;
            return (
              <div key={category.key} className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <IconComponent className="h-5 w-5 mt-0.5 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{category.title}</h4>
                        {category.required && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                            Required
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {category.description}
                      </p>
                    </div>
                  </div>
                  
                  <Switch
                    checked={currentConsent[category.key]}
                    onCheckedChange={(checked) => 
                      setCurrentConsent(prev => ({ ...prev, [category.key]: checked }))
                    }
                    disabled={category.required}
                  />
                </div>
                {category.key !== 'preferences' && <Separator />}
              </div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-4">
          <Button variant="outline" onClick={() => setShowDialog(false)} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex-1">
            Save Preferences
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 